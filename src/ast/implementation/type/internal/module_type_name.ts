import { InternalTypeName } from "./internal_type_name";

export class ModuleTypeName extends InternalTypeName {
    public readonly path: string;

    constructor(id: number, src: string, type: string, typeString: string, modulePath: string) {
        super(id, src, type, typeString);
        this.path = modulePath;
    }
}
