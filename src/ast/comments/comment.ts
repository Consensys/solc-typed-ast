import { RawCommentKind } from "../constants";

export interface CommentLoc {
    start: number;
    end: number;
}

export class RawComment {
    /**
     * Type of comment
     */
    kind: RawCommentKind;

    /**
     * The entire text of the comment include *s and /s
     */
    text: string;

    /**
     * The text of the comment without * and /. I.e. only the actual comment body
     */
    internalText: string;

    /**
     * The location of this comment
     */
    loc: CommentLoc;

    constructor(kind: RawCommentKind, text: string, internalText: string, loc: CommentLoc) {
        this.kind = kind;
        this.text = text;
        this.internalText = internalText;
        this.loc = loc;
    }
}
