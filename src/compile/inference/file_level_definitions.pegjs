{
    // Dummy uses to silence unused function TSC errors in auto-generated code
    expected;
    error;
}

SourceUnit =
    __ flds: (t: FileLevelDefinition __  { return t; })* {
        return flds as AnyFileLevelNode[];
    }

FileLevelDefinition =
    PragmaDirective
    / ImportDirective
    / Constant
    / FreeFunction
    / ContractDefinition
    / EnumDef
    / EventDef
    / ErrorDef
    / StructDef
    / UserValueTypeDef
    / UsingForDirective

// ==== Pragma

PragmaValue =
    NonSemicolonSoup { return text().trim(); }

PragmaDirective =
    PRAGMA __ name: Identifier __ value: PragmaValue __ ";" {
        return { kind: FileLevelNodeKind.Pragma, location: location(), name, value } as FLPragma;
    }

// ==== Import Directives

Symbol = 
    name: (Identifier) alias: (__ AS __ Identifier)? {
        return { name, alias: alias !== null ? alias[3] : null } as SymbolDesc;
    }

SymbolList =
    head: Symbol
    tail: ( __ COMMA __ Symbol)* {
        return tail.reduce(
            (acc: SymbolDesc[], el: [any, any, any, SymbolDesc]) => {
                acc.push(el[3]);
                
                return acc;
            },
            [head]
        );
    }

ImportDirective =
    IMPORT __ path: StringLiteral __ SEMICOLON {
        return { kind: FileLevelNodeKind.Import, location: location(), path, unitAlias: null, symbols: [] } as FLImportDirective;
    }
    / IMPORT __ path: StringLiteral __ AS __ unitAlias: Identifier __ SEMICOLON {
        return { kind: FileLevelNodeKind.Import, location: location(), path, unitAlias, symbols: [] } as FLImportDirective;
    }
    / IMPORT __ ASTERISK __ AS __ unitAlias: Identifier __ FROM __ path: StringLiteral __ SEMICOLON {
        return { kind: FileLevelNodeKind.Import, location: location(), path, unitAlias, symbols: [] } as FLImportDirective;
    }
    / IMPORT __ LBRACE __ symbols: SymbolList __ RBRACE __ FROM __ path: StringLiteral __ SEMICOLON {
        return { kind: FileLevelNodeKind.Import, location: location(), symbols, path, unitAlias: null } as FLImportDirective;
    }

// ==== Global Constants

// Global constants don't support reference types.
// Only other multi-word case is "address payable".
ConstantType =
    (ADDRESS (__ PAYABLE)?) / (Identifier (__ LBRACKET Number? RBRACKET)*) { return text(); }

Constant = ConstantType __ CONSTANT  __ name: Identifier __ EQUAL __ value: NonSemicolonSoup __  SEMICOLON {
    return { kind: FileLevelNodeKind.Constant, location: location(), name, value } as FLConstant;
}

// ==== Free Functions

FreeFunArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
FreeFunMut = (!RETURNS Identifier __)* { return text(); }
FreeFunBody = LBRACE __ BraceSoup __ RBRACE { return text(); }

FreeFunReturns = RETURNS __ FreeFunArgs { return text(); }

FreeFunction = FUNCTION __ name: Identifier __ args: FreeFunArgs __ mutability: FreeFunMut returns: FreeFunReturns? __ body: FreeFunBody {
    return {
        kind: FileLevelNodeKind.Function,
        location: location(),
        name,
        args,
        mutability: mutability.trim(),
        returns,
        body
    } as FLFreeFunction;
}

// ==== Contract definitions

IdentifierPath =
    head: Identifier tail: ("." Identifier)* { return text(); }

BaseArgs = LPAREN __ ParenSoup __ RPAREN

BaseClassList =
    head: IdentifierPath __ BaseArgs? tail: (__ COMMA __ IdentifierPath __ BaseArgs?)* { return text(); }

ContractBody = LBRACE __ BraceSoup __ RBRACE { return text(); }

ContractDefinition = abstract: (ABSTRACT __)? kind: (CONTRACT / LIBRARY / INTERFACE) __ name: Identifier bases: (__ IS __ BaseClassList)? __ body: ContractBody {
    return { 
        abstract: abstract !== null,
        kind: FileLevelNodeKind.Contract,
        location: location(),
        contractKind: kind,
        name,
        bases: bases !== null ? bases[3].trim() : null,
        body
    } as FLContractDefinition;
}

// ==== Struct definitions

StructBody = LBRACE __ BraceSoup __ RBRACE { return text(); }
StructDef = STRUCT __ name: Identifier __ body: StructBody {
    return {
        kind: FileLevelNodeKind.Struct,
        location: location(),
        name,
        body
    } as FLStructDefinition;
}

// ==== Enum definitions

EnumDefBody = LBRACE __ BraceSoup __ RBRACE { return text(); }
EnumDef = ENUM __ name: Identifier __ body: EnumDefBody {
    return {
        kind: FileLevelNodeKind.Enum,
        location: location(),
        name,
        body
    } as FLEnumDefinition;
}

// ==== Event

EventArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
EventDef = EVENT __ name: Identifier __ args: EventArgs __ isAnonymous: (ANONYMOUS)? __ SEMICOLON {
    return {
        kind: FileLevelNodeKind.Event,
        location: location(),
        name,
        args,
        anonymous: isAnonymous !== null
    } as FLEventDefinition;
}

// ==== Error

ErrorArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
ErrorDef = ERROR __ name: Identifier __ args: ErrorArgs __ SEMICOLON {
    return {
        kind: FileLevelNodeKind.Error,
        location: location(),
        name,
        args 
    } as FLErrorDefinition;
}

// ==== User-defined value types

UserValueTypeDef = TYPE __ name: Identifier __ IS __ valueType: NonSemicolonSoup __ SEMICOLON {
    return {
        kind: FileLevelNodeKind.UserValueType,
        location: location(),
        name,
        valueType
    } as FLUserValueType;
}

// ==== Using-for directives

CustomizableOperator =
    '&'
    / '|'
    / '^'
    / '~'
    / '+'
    / '-'
    / '*'
    / '/'
    / '%'
    / '=='
    / '!='
    / '<='
    / '>='
    / '<'
    / '>';

UsingEntry =
    name: (IdentifierPath) operator: (__ AS __ CustomizableOperator)? {
        if (operator === null) {
            return name;
        }

        return { name, operator: operator[3] } as FLCustomizableOperator;
    }


UsingEntryList =
    head: UsingEntry __ tail: (__ COMMA __ UsingEntry __ )* {
        return tail.reduce(
            (acc: string[], el: string) => {
                acc.push(el[3]);

                return acc;
            },
            [head]
        );
    }

UsingForDirective =
    USING __ utils: (IdentifierPath / ("{" __ UsingEntryList __ "}")) __ FOR __ typeName: IdentifierPath __ isGlobal: (GLOBAL)? SEMICOLON {
        const node: FLUsingForDirective = {
            kind: FileLevelNodeKind.UsingForDirective,
            location: location(),
            typeName,
            isGlobal: isGlobal !== null
        };

        if (typeof utils === "string") {
            node.libraryName = utils;
        } else {
            node.functionList = utils[2];
        }

        return node;
    }

// ==== Soups - helper rules for matching semi-structured text with comments and strings inside,
// that still try to account for either matching () or matching {}, or for an ending semicolon.
NonSemicolonSoup =
    (
        ([^"'/;]+ ("/" [^/'"*;])?) // non-comment, non-string-literal, non-semicolon anything
        / StringLiteral // string literal
        / Comment // comment
    )* { return text(); }

ParenSoup =
    (
        (
            ([^"'()/]+ ("/" [^/*"'()])?)  // non-comment, non-string literal, non-parenthesis anything
            / StringLiteral  // string literal
            / Comment // comment 
        )
        / LPAREN __ ParenSoup __ RPAREN
    )*

BraceSoup =
    (
        (
            ([^"'{}/]+ ("/" [^/*'"{}])?)  // non-comment, non string literal, non-braces anything
            / StringLiteral  // string literal
            / Comment // comment 
        )   
        / LBRACE __ BraceSoup __ RBRACE
    )*

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

LineTerminatorSequence =
    "\n"
    / "\r\n"
    / "\r"
    / "\u2028"
    / "\u2029"

__ =
    (PrimitiveWhiteSpace / LineTerminator / Comment)*

// ==== Comments

NonLineTerminator =
    [^\n\r\u2028\u2029]

EndOfLineComment = 
    "//" "/"* NonLineTerminator*  { return text() }

// This is hacky but it works. TODO: find a simpler expression thats more obviously correct.
EnclosedComment = "/*" ([^*]+ / ("*"+ [^/*]))* "*"+ "/" { return text(); }

Comment = EndOfLineComment / EnclosedComment

// ==== Keywords

IMPORT = "import"
AS = "as"
FROM = "from"
SEMICOLON = ";"
ASTERISK = "*"
LPAREN = "("
RPAREN = ")"
LBRACE = "{"
RBRACE = "}"
LBRACKET = "["
RBRACKET = "]"
COMMA = ","
EQUAL = "="
ADDRESS = "address"
PAYABLE = "payable"
ABSTRACT = "abstract"
CONTRACT = "contract"
LIBRARY = "library"
INTERFACE = "interface"
STRUCT = "struct"
ENUM = "enum"
CONSTANT = "constant"
FUNCTION = "function"
IS = "is"
TYPE = "type"
RETURNS = "returns"
PRAGMA = "pragma"
ERROR = "error"
EVENT = "event"
USING = "using"
FOR = "for"
GLOBAL = "global"
ANONYMOUS = "anonymous"

// ==== String literals

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

HexNumber =
    "0x"i digits: HexDigit+

ExponentIndicator =
    "e" / "E"

SignedInteger =
    [+-]? DecDigit+

ExponentPart =
    ExponentIndicator SignedInteger

DecNumber =
    DecDigit+ ExponentPart?

Number =
    value: (HexNumber / DecNumber)

Identifier =
    id: ([a-zA-Z$_][a-zA-Z$0-9_]*) { return text(); }
