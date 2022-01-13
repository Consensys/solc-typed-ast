SourceUnit =
    __ tlds: (t: TopLevelDefinition __  { return t; })* {
        // Dummy uses to silence unused function TSC errors in auto-generated code
        expected;
        error;
        return tlds as TopLevelNode<any>[];
    }

TopLevelDefinition
    = Pragma
    / ImportDirective
    / Constant
    / FreeFunction
    / ContractDefinition
    / EnumDef
    / StructDef
    / UserValueTypeDef
    / ErrorDef


// ==== Pragma

PragmaValue = NonSemicolonSoup { return text().trim(); }
Pragma =
    PRAGMA __ name: Identifier __ value: PragmaValue __ ";" {
        return {kind: TopLevelNodeKind.Pragma, location: location(), name, value} as TLPragma;
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
        return {kind: TopLevelNodeKind.Import, location: location(), path, unitAlias: null, symbols: [] } as TLImportDirective;
    }
    / IMPORT __ path: StringLiteral __ AS __ unitAlias: Identifier __ SEMICOLON {
        return {kind: TopLevelNodeKind.Import, location: location(), path, unitAlias, symbols: [] } as TLImportDirective;
    }
    / IMPORT __ ASTERISK __ AS __ unitAlias: Identifier __ FROM __ path: StringLiteral __ SEMICOLON {
        return {kind: TopLevelNodeKind.Import, location: location(), path, unitAlias, symbols: [] } as TLImportDirective;
    }
    / IMPORT __ LBRACE __ symbols: SymbolList __ RBRACE __ FROM __ path: StringLiteral __ SEMICOLON {
        return {kind: TopLevelNodeKind.Import, location: location(), symbols, path, unitAlias: null } as TLImportDirective;
    }

// ==== Global Constants

// global constants don't support reference types I think?
ConstantType 
    = Identifier (__ LBRACKET Number? RBRACKET)*  { return text(); }

Constant = ConstantType __ CONSTANT  __ name: Identifier __ EQUAL __ value: NonSemicolonSoup __  SEMICOLON {
    return {kind: TopLevelNodeKind.Constant, location: location(), name, value } as TLConstant;
}

// ==== Free Functions

FreeFunArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
FreeFunMut = (!RETURNS Identifier __)* { return text(); }
FreeFunBody = LBRACE __ BraceSoup __ RBRACE { return text(); }

FreeFunReturns = RETURNS __ FreeFunArgs { return text(); }

FreeFunction = FUNCTION __ name: Identifier __ args: FreeFunArgs __ mutability: FreeFunMut returns: FreeFunReturns? __ body: FreeFunBody {
    return {
        kind: TopLevelNodeKind.Function,
        location: location(),
        name,
        args ,
        mutability: mutability.trim(),
        returns,
        body
    } as TLFreeFunction;
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
        kind: TopLevelNodeKind.Contract,
        location: location(),
        contract_kind: kind,
        name,
        bases: bases !== null ? bases[3].trim() : null,
        body
    } as TLContractDefinition
}

// ==== Struct definitions

StructBody = LBRACE __ BraceSoup __ RBRACE { return text(); }
StructDef = STRUCT __ name: Identifier __ body: StructBody {
    return {
        kind: TopLevelNodeKind.Struct,
        location: location(),
        name,
        body
    } as TLStructDefinition
}

// ==== Enum definitions

EnumDefBody = LBRACE __ BraceSoup __ RBRACE { return text(); }
EnumDef = ENUM __ name: Identifier __ body: EnumDefBody {
    return {
        kind: TopLevelNodeKind.Enum,
        location: location(),
        name,
        body
    } as TLEnumDefinition
}

// ==== User-defined value types

UserValueTypeDef = TYPE __ name: Identifier __ IS __ value_type: NonSemicolonSoup __ SEMICOLON {
    return {
        kind: TopLevelNodeKind.UserValueType,
        location: location(),
        name,
        value_type
    } as TLUserValueType
}

// ==== Error

ErrorArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
ErrorDef = ERROR __ name: Identifier __ args: ErrorArgs __ SEMICOLON {
    return {
        kind: TopLevelNodeKind.Error,
        location: location(),
        name,
        args 
    } as TLErrorDefinition;
}


// ==== Soups - helper rules for matching semi-structured text with comments and strings inside,
// that still try to account for either matching () or matching {}, or for an ending semicolon.
NonSemicolonSoup =
    (([^"'/;]+ ("/" [^/'"*;])?) // non-comment, non-string-literal, non-semicolon anything
     / StringLiteral // string literal
     / Comment // comment
    )* { return text(); }

ParenSoup
    = ((
        ([^"'()/]+ ("/" [^/*"'()])?)  // non-comment, non-string literal, non-parenthesis anything
        / StringLiteral  // string literal
        / Comment // comment 
      )
    / LPAREN __ ParenSoup __ RPAREN)*

BraceSoup
    = ((
        ([^"'{}/]+ ("/" [^/*'"{}])?)  // non-comment, non string literal, non-braces anything
        / StringLiteral  // string literal
        / Comment // comment 
       )   
    / LBRACE __ BraceSoup __ RBRACE)*

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
    id: ([a-zA-Z_][a-zA-Z0-9_]*) { return text(); }
