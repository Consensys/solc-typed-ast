{
    expected;
    error;
    peg$anyExpectation;
    peg$parse__;
}

CommentSoup =
    t: (
        ([^"'/]+ (!("//" / "///" / "/*") "/")?) { return text(); } // non-comment, non-string-literal anything
        / StringLiteral { return text(); } // string literal
        / (c: Comment __ { return c; }) // comment
    )* { return t; }

Comment
    = BlockComment
    / NatspecLineGroup
    / LineComment


FirstBlockLine = "/*" body: ((!"*/" NonLineTerminator)* { return text(); }) LineTerminator { return body; }
BlockLine = (PrimitiveWhiteSpace* (!"*/" "*"))? body: ((!"*/" NonLineTerminator)* { return text(); }) LineTerminator { return body; }
LastBlockLine = (PrimitiveWhiteSpace* (!"*/" "*"))? body: ((!"*/" NonLineTerminator)* { return text(); }) "*/" { return body; }

MultiLineBlockComment = start: FirstBlockLine inner: BlockLine* last: LastBlockLine {
    const isNatSpec = start[0] === "*";

    // For NatSpec comments we strip 1 space from each inner line (if present)
    // to be compatible with the Solidity compiler's behavior
    if (isNatSpec) {
        inner = inner.map((l: string) => l.startsWith(" ") ? l.slice(1) : l);
        last = last.startsWith(" ") ? last.slice(1) : last;
    }

    let body = [start, ...inner, last].join("\n")

    // for natspec skip the second *
    body = isNatSpec ? body.slice(1) : body;

    const kind = isNatSpec ? RawCommentKind.BlockNatSpec : RawCommentKind.BlockComment;

    return new RawComment(kind, text(), body, mkLoc(location()) )
}

SingleLineBlockComment = "/*" body: ((!"*/" NonLineTerminator)* { return text(); }) "*/" {
    const isNatSpec = body[0] === "*";
    return new RawComment(
        isNatSpec ? RawCommentKind.BlockNatSpec : RawCommentKind.BlockComment,
        text(),
        isNatSpec ? body.slice(1) : body, // for natspec skip the second *
        mkLoc(location())
    );
}

BlockComment = MultiLineBlockComment / SingleLineBlockComment

NonLineTerminator =
    [^\n\r\u2028\u2029]

LineComment = 
    "//" body: (NonLineTerminator* { return text(); }) LineTerminator {
        return new RawComment(RawCommentKind.SingleLineComment, text(), body, mkLoc(location()));
    }

LineNatspec = 
    PrimitiveWhiteSpace* "///" body: (NonLineTerminator* { return text(); }) LineTerminator {
        return body.startsWith(" ") ? body.slice(1) : body;
    }

NatspecLineGroup =
    bodies: LineNatspec+ {
        return new RawComment(RawCommentKind.LineGroupNatSpec, text(), bodies.join("\n"), mkLoc(location()));
    }

// ==== White space

PrimitiveWhiteSpace =
    "\t"
    / "\v"
    / "\f"
    / " "
    / "\u00A0"
    / "\uFEFF"
    / Zs

// Separator, Space
Zs =
    [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

LineTerminator =
    [\n\r\u2028\u2029]

__ =
    (PrimitiveWhiteSpace / LineTerminator)*

StringLiteral =
    "'" chars: SingleStringChar* "'" { return chars.join(""); }
    / '"' chars: DoubleStringChar* '"' { return chars.join(""); }

AnyChar =
    .

DoubleStringChar =
    !('"' / "\\" / LineTerminator) AnyChar { return text(); }
    / "\\" sequence: EscapeSequence { return sequence; }
    / LineContinuation

SingleStringChar =
    !("'" / "\\" / LineTerminator) AnyChar { return text(); }
    / "\\" sequence: EscapeSequence { return sequence; }
    / LineContinuation

LineContinuation =
    "\\" LineTerminatorSequence { return ""; }

EscapeSequence =
    CharEscapeSequence
    / "0" !DecDigit { return "\0"; }
    / HexEscapeSequence
    / UnicodeEscapeSequence
    / AnyChar // Allow invalid hex sequences as a fallback

CharEscapeSequence =
    SingleEscapeChar
    / NonEscapeChar

SingleEscapeChar =
    "'"
    / '"'
    / "\\"
    / "b"  { return "\b"; }
    / "f"  { return "\f"; }
    / "n"  { return "\n"; }
    / "r"  { return "\r"; }
    / "t"  { return "\t"; }
    / "v"  { return "\v"; }

NonEscapeChar =
    !(EscapeChar / LineTerminator) AnyChar { return text(); }

HexDigit =
    [0-9a-f]i

DecDigit =
    [0-9]

EscapeChar =
    SingleEscapeChar
    / DecDigit
    / "x"
    / "u"

HexEscapeSequence =
    "x" digits:$(HexDigit HexDigit) {
        return String.fromCharCode(parseInt(digits, 16));
    }

UnicodeEscapeSequence =
    "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
        return String.fromCharCode(parseInt(digits, 16));
    }

LineTerminatorSequence =
    "\n"
    / "\r\n"
    / "\r"
    / "\u2028"
    / "\u2029"
