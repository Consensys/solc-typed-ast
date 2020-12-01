import { ASTNode } from "../../../src";

interface NodeImprint {
    id: number;
    src: string;
    type: string;
}

interface SourceImprint {
    [type: string]: NodeImprint[];
}

export function createImprint(node: ASTNode): SourceImprint {
    const sourceImprint: SourceImprint = {};

    node.walk((child) => {
        const constructor = child.constructor.name;
        const nodeImprint = {
            id: child.id,
            src: child.src,
            type: child.type
        };

        if (constructor in sourceImprint) {
            sourceImprint[constructor].push(nodeImprint);
        } else {
            sourceImprint[constructor] = [nodeImprint];
        }
    });

    return sourceImprint;
}
