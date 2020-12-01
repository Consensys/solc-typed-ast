import expect from "expect";
import {
    ASTNode,
    ASTWriter,
    DefaultASTWriterMapping,
    LatestCompilerVersion,
    SpacelessFormatter
} from "../../../../src";

describe("ASTWriter", () => {
    describe("write()", () => {
        it("Throws an error on unknown ASTNode", () => {
            const writer = new ASTWriter(
                new Map(),
                new SpacelessFormatter(),
                LatestCompilerVersion
            );

            const node = new ASTNode(0, "0:0:0", "CustomNode");

            expect(() => writer.write(node)).toThrow();
        });

        it("Throws an error on non-ASTNode input", () => {
            const writer = new ASTWriter(
                DefaultASTWriterMapping,
                new SpacelessFormatter(),
                LatestCompilerVersion
            );

            expect(() => writer.write({} as ASTNode)).toThrow();
        });
    });
});
