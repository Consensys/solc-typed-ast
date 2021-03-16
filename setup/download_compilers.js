const fse = require("fs-extra");
const http = require("http");
const https = require("https");
const path = require("path");

const constsModulePath = path.join(__dirname, "../dist/compile/constants.js");

if (!fse.existsSync(constsModulePath)) {
    console.log("Constants module is not accessible yet");

    process.exit(0);
}

const { VersionToCompilerFileName } = require(constsModulePath);

/**
 * Downloads file from remote HTTP[S] host and puts its contents to the
 * specified location.
 */
async function download(url, filePath) {
    const proto = !url.charAt(4).localeCompare("s") ? https : http;

    return new Promise((resolve, reject) => {
        const file = fse.createWriteStream(filePath);

        let fileInfo = null;

        const request = proto.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get "${url}" (${response.statusCode})`));

                return;
            }

            fileInfo = {
                mime: response.headers["content-type"],
                size: parseInt(response.headers["content-length"], 10)
            };

            response.pipe(file);
        });

        file.on("finish", () => resolve(fileInfo));

        request.on("error", (err) => {
            fse.unlink(filePath, () => reject(err));
        });

        file.on("error", (err) => {
            fse.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

(async () => {
    const compilersDir = path.resolve(path.join(__dirname, "..", "compilers"));

    fse.ensureDirSync(compilersDir);

    console.log("Compiler snapshot directory: " + compilersDir);

    const promises = [];

    for (const [version, fileName] of VersionToCompilerFileName.entries()) {
        const url = "https://binaries.soliditylang.org/bin/" + fileName;
        const filePath = path.join(compilersDir, fileName);

        if (fse.existsSync(filePath)) {
            console.log(
                `Skipped downloading ${fileName} (version ${version}) as it is already present at ${filePath}`
            );
        } else {
            console.log(`Started downloading ${fileName} (version ${version})`);

            promises.push(
                download(url, filePath).then(() =>
                    console.log(`Downloaded ${fileName} from ${url}`)
                )
            );
        }
    }

    try {
        await Promise.all(promises);
    } catch (e) {
        console.log(e.stack);

        process.exitCode = 1;
    }
})();
