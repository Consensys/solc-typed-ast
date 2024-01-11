import { CommentLoc, RawComment } from "./comment";
import { RawCommentKind } from "../constants";

function mkLoc(raw: any): CommentLoc {
    return { start: raw.start.offset, end: raw.end.offset };
}

export function parseComments(contents: string): (RawComment | string)[] {
    // @ts-ignore
    return parse(contents);
}
