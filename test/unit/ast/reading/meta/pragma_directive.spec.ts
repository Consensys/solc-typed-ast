import expect from "expect";
import { ASTReader, compileJson, PragmaDirective } from "../../../../../src";

describe("PragmaDirective", () => {
    const samples = new Map([
        ["0.4.13", "test/samples/solidity/meta/pragma_0413.json"],
        ["0.5.0", "test/samples/solidity/meta/pragma_050.json"]
    ]);

    for (const [version, sample] of samples.entries()) {
        describe(`Solc ${version}: ${sample}`, () => {
            let directives: readonly PragmaDirective[];

            beforeAll(async () => {
                const reader = new ASTReader();
                const { data } = await compileJson(sample, version);
                const [mainUnit] = reader.read(data);

                directives = mainUnit.vPragmaDirectives;
            });

            it("Detect correct number of nodes", () => {
                expect(directives.length).toEqual(3);
            });

            it("Complex pragma directive is valid", () => {
                const directive = directives[0];

                expect(directive.id).toEqual(1);
                expect(directive instanceof PragmaDirective).toEqual(true);
                expect(directive.vIdentifier).toEqual("solidity");
                expect(directive.vValue).toEqual(">=0.4.0<0.6.0<0.6.0");
            });

            it("Unformatted pragma directive is valid", () => {
                const directive = directives[1];

                expect(directive.id).toEqual(2);
                expect(directive instanceof PragmaDirective).toEqual(true);
                expect(directive.vIdentifier).toEqual("solidity");
                expect(directive.vValue).toEqual(">=0.4.13");
            });

            it("Trailing pragma directive is valid", () => {
                const directive = directives[2];

                expect(directive.id).toEqual(8);
                expect(directive instanceof PragmaDirective).toEqual(true);
                expect(directive.vIdentifier).toEqual("solidity");
                expect(directive.vValue).toEqual("<0.6.0");
            });
        });
    }
});
