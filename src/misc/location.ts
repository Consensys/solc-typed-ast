import { ASTNode } from "../ast/ast_node";
import { SourceUnit } from "../ast/implementation/meta/source_unit";

const SrcLocation = require("src-location");

export interface Point {
    line: number;
    column: number;
}

export interface Coordinates {
    start: Point;
    end: Point;
}

export class Location {
    fileName: string;
    src: string;

    constructor(fileName: string, src: string) {
        this.fileName = fileName;
        this.src = src;
    }

    static createForNode(node: ASTNode): Location {
        const root = node.root;

        if (root instanceof SourceUnit) {
            return new Location(root.sourceEntryKey, node.src);
        }

        throw new Error(
            `Unable to create location for node (${node.type} #${node.id}) the root of which is not a source unit`
        );
    }

    getCoordinates(content?: string): Coordinates {
        if (content === undefined) {
            return {
                start: {
                    line: 0,
                    column: 0
                },

                end: {
                    line: 0,
                    column: 0
                }
            };
        }

        const coords = this.src.split(":");
        const index = parseInt(coords[0], 10);
        const length = parseInt(coords[1], 10);

        const start = SrcLocation.indexToLocation(content, index, true) as Point;
        const end = SrcLocation.indexToLocation(content, index + length, true) as Point;

        return { start, end };
    }
}
