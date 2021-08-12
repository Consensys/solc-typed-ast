import { ASTNode, ASTNodeConstructor } from "./ast_node";
import { SourceUnit } from "./implementation/meta/source_unit";
import { LegacyConfiguration } from "./legacy";
import { ModernConfiguration } from "./modern";
import { DefaultPostprocessorMapping } from "./postprocessing";
import { sequence } from "./utils";

export interface ASTNodeProcessor<T extends ASTNode> {
    process(
        reader: ASTReader,
        config: ASTReaderConfiguration,
        raw: any
    ): ConstructorParameters<ASTNodeConstructor<T>>;
}

export interface ASTNodePostprocessor {
    readonly priority: number;

    process(node: ASTNode, context: ASTContext, sources?: Map<string, string>): void;
}

export interface ASTReadingRule {
    constructor: ASTNodeConstructor<ASTNode>;
    processor: ASTNodeProcessor<ASTNode>;
}

export interface ASTReadingRules {
    Default: ASTReadingRule;

    [type: string]: ASTReadingRule;
}

export type ASTReadingSignatureDetector = (raw: any) => string;

export interface ASTReaderConfiguration {
    signatureDetector: ASTReadingSignatureDetector;

    rules: ASTReadingRules;
}

const contextIdSequence = sequence();

export class ASTContext {
    /**
     * ID to distinct different contexts
     */
    id = contextIdSequence.next().value;

    /**
     * Map from ID number to the `AST` node with same ID in tree
     */
    map = new Map<number, ASTNode>();

    constructor(...nodes: ASTNode[]) {
        this.register(...nodes);
    }

    /**
     * Max ID of the registered nodes
     */
    get lastId(): number {
        let last = 0;

        for (const id of this.map.keys()) {
            if (id > last) {
                last = id;
            }
        }

        return last;
    }

    get nodes(): Iterable<ASTNode> {
        return this.map.values();
    }

    register(...nodes: ASTNode[]): void {
        for (const node of nodes) {
            if (this.map.has(node.id)) {
                throw new Error(`The id ${node.id} is already taken for the context`);
            }

            if (node.context) {
                node.context.unregister(node);
            }

            this.map.set(node.id, node);

            node.context = this;
        }
    }

    unregister(...nodes: ASTNode[]): void {
        for (const node of nodes) {
            if (!this.contains(node)) {
                throw new Error(`Supplied node with id ${node.id} not belongs to the context`);
            }

            this.map.delete(node.id);

            node.context = undefined;
        }
    }

    locate(id: number): ASTNode {
        return this.map.get(id) as ASTNode;
    }

    require(id: number): ASTNode {
        const node = this.locate(id);

        if (node) {
            return node;
        }

        throw new Error("Required node not found for id " + id);
    }

    contains(node: ASTNode): boolean {
        return this.locate(node.id) === node;
    }
}

export class ASTPostprocessor {
    mapping: Map<ASTNodeConstructor<ASTNode>, ASTNodePostprocessor[]>;

    constructor(mapping = DefaultPostprocessorMapping) {
        this.mapping = mapping;
    }

    getPostprocessorsForNode(node: ASTNode): ASTNodePostprocessor[] | undefined {
        return this.mapping.get(node.constructor as ASTNodeConstructor<ASTNode>);
    }

    processNode(node: ASTNode, context: ASTContext, sources?: Map<string, string>): void {
        const postprocessors = this.getPostprocessorsForNode(node);

        if (postprocessors) {
            for (const postprocessor of postprocessors) {
                postprocessor.process(node, context, sources);
            }
        }
    }

    processContext(context: ASTContext, sources?: Map<string, string>): void {
        const groupsByPriority = new Map<number, ASTNode[]>();

        for (const node of context.nodes) {
            const postprocessors = this.getPostprocessorsForNode(node);

            if (postprocessors) {
                for (const postprocessor of postprocessors) {
                    const priority = postprocessor.priority;
                    const group = groupsByPriority.get(priority);

                    if (group) {
                        group.push(node);
                    } else {
                        groupsByPriority.set(priority, [node]);
                    }
                }
            }
        }

        const groups = Array.from(groupsByPriority)
            .sort((a, b) => a[0] - b[0])
            .map((entry) => entry[1]);

        for (const nodes of groups) {
            for (const node of nodes) {
                this.processNode(node, context, sources);
            }
        }
    }
}

export enum ASTKind {
    Any = "any",
    Modern = "modern",
    Legacy = "legacy"
}

export class ASTReader {
    /**
     * A tree context for the processed nodes
     */
    context: ASTContext;

    /**
     * A tree postprocessor to apply for the processed nodes
     */
    postprocessor: ASTPostprocessor;

    constructor(context = new ASTContext(), postprocessor = new ASTPostprocessor()) {
        this.context = context;
        this.postprocessor = postprocessor;
    }

    /**
     * Takes a Solc-compiler JSON output data and reads it to produce
     * universal AST node tree.
     *
     * @param data      Compiler output data to process.
     * @param kind      Kind of an AST tree (legacy, modern or any).
     * @param sources   Map with the source file names as keys
     *                  and corresponding source content strings as values.
     *
     * @returns An array of `SourceUnit`s for each of the source entries in the input.
     */
    read(data: any, kind = ASTKind.Any, sources?: Map<string, string>): SourceUnit[] {
        const entries: Array<[string, any]> = Object.entries(data.sources);
        const rootNodeTypeName = "SourceUnit";
        const result: SourceUnit[] = [];

        for (const [key, content] of entries) {
            let ast;

            if (kind === ASTKind.Modern) {
                ast = content.ast;
            } else if (kind === ASTKind.Legacy) {
                ast = content.legacyAST || content.AST;
            } else {
                ast = content.ast || content.legacyAST || content.AST;
            }

            if (!ast) {
                throw new Error(`Unable to detect AST for entry "${key}"`);
            }

            let config: ASTReaderConfiguration;

            if (ast.nodeType === rootNodeTypeName) {
                config = ModernConfiguration;
            } else if (ast.name === rootNodeTypeName) {
                config = LegacyConfiguration;
            } else {
                throw new Error(`Unable to detect reader configuration for entry "${key}"`);
            }

            ast.sourceEntryKey = key;

            const sourceUnit = this.convert(ast, config) as SourceUnit;

            result.push(sourceUnit);
        }

        this.postprocessor.processContext(this.context, sources);

        return result;
    }

    /**
     * Takes a raw Solc node object and produces
     * corresponding universal AST node instance.
     */
    convert(raw: any, config: ASTReaderConfiguration): ASTNode {
        if (!raw) {
            throw new Error("Unable to read " + String(raw) + " as an AST node");
        }

        const signature = config.signatureDetector(raw);
        const rule = signature in config.rules ? config.rules[signature] : config.rules.Default;

        const { constructor, processor } = rule;

        const args = processor.process(this, config, raw);
        const node = new constructor(...args);

        this.context.register(node);

        return node;
    }

    /**
     * Takes an array of raw Solc node objects and produces
     * array of corresponding universal AST node instances.
     *
     * If input is not an array, then the empty array is returned.
     */
    convertArray(array: any, config: ASTReaderConfiguration): ASTNode[] {
        const result: ASTNode[] = [];

        if (array instanceof Array) {
            for (const raw of array) {
                const node = this.convert(raw, config);

                result.push(node);
            }
        }

        return result;
    }
}
