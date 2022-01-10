SourceUnit =
    (__ t: TopLevelDefinition __  { return t; })*

TopLevelDefinition = 
     ImportDirective
    / Constant
    / FreeFunction
    / ContractDefinition
    / EnumDef
    / StructDef
    / UserValueTypeDef


// ==== global constants

// global constants don't support reference types I think?
ConstantType 
    = Identifier (__ LBRACKET Number? RBRACKET)*  { return text(); }

NonSemicolonSoup = (__ ( [^;"']+ / StringLiteral))* { return text(); }
Constant = ConstantType __ CONSTANT  __ name: Identifier __ EQUAL __ value: NonSemicolonSoup __  SEMICOLON {
    return {type: TopLevelNodeKind.Constant, location: location(), name, value };
}

// ==== Free Functions

FreeFunArgs = LPAREN __ ParenSoup __ RPAREN { return text(); }
FreeFunMut = (!RETURNS Identifier __)* { return text(); }
FreeFunBody = LBRACE __ BraceSoup __ RBRACE { return text(); }

FreeFunReturns = RETURNS __ FreeFunArgs { return text(); }

FreeFunction = FUNCTION __ name: Identifier __ args: FreeFunArgs __ mutability: FreeFunMut returns: FreeFunReturns? __ body: FreeFunBody {
    return {type: TopLevelNodeKind.Function, location: location(), name, args , mutability: mutability.trim(), returns, body};
}

BaseArgs = LPAREN __ ParenSoup __ RPAREN
BaseClassList =
    head: Identifier __ BaseArgs? tail: (__ COMMA __ Identifier __ BaseArgs?)* { return text(); }

// ==== Contract definitions

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
    }
}

// ==== Struct definitions

StructBody = LBRACE __ BraceSoup __ RBRACE { return text(); }
StructDef = STRUCT __ name: Identifier __ body: StructBody {
    return {
        kind: TopLevelNodeKind.Struct,
        location: location(),
        name,
        body
    }
}

// ==== Enum definitions

EnumDef = ENUM __ Identifier __ LBRACE __ BraceSoup __ RBRACE
UserValueTypeDef = TYPE __ Identifier __ IS __ NonSemicolonSoup __ SEMICOLON

Symbol = 
    name: (Identifier) alias: (__ AS __ Identifier)? {
        return { name, alias: alias !== null ? alias[3] : null } as SymbolDesc;
    }

SymbolList =
    head: Symbol
    tail: ( __ COMMA __ Symbol)* {
        return tail.reduce(
            (acc, el) => {
                acc.push(el[3]);
                
                return acc;
            },
            [head]
        );
    }

ImportDirective =
    IMPORT __ path: StringLiteral __ SEMICOLON {
        return { path, unitAlias: undefined, symbolAliases: [] } as ImportDirectiveDesc;
    }
    / IMPORT __ path: StringLiteral __ AS __ unitAlias: Identifier __ SEMICOLON {
        return { path, unitAlias, symbolAliases: [] } as ImportDirectiveDesc;
    }
    / IMPORT __ ASTERISK __ AS __ unitAlias: Identifier __ FROM __ path: StringLiteral __ SEMICOLON {
        return { path, unitAlias, symbolAliases: [] } as ImportDirectiveDesc;
    }
    / IMPORT __ LBRACE __ symbolAliases: SymbolList __ RBRACE __ FROM __ path: StringLiteral __ SEMICOLON {
        return { symbolAliases, path, unitAlias: undefined } as ImportDirectiveDesc;
    }

// ==== Soups - helper rules for matching semi-structured with comments and strings inside,
// that still try to account for either matchin () or matching {}

ParenSoup
    = ((
        ([^"'()/]+ ("/" [^/*])?)  // non-comment, non string literal anything
        / StringLiteral  // string literal
        / Comment // comment 
      )
    / LPAREN __ ParenSoup __ RPAREN)*

BraceSoup
    = ((
        ([^"'{}/]+ ("/" [^/*])?)  // non-comment, non string literal anything
        / StringLiteral  // string literal
        / Comment // comment 
       )   
    / LBRACE __ BraceSoup __ RBRACE)*

// ==== White space

PrimitiveWhiteSpace "whitespace" =
    "\t"
    / "\v"
    / "\f"
    / " "
    / "\u00A0"
    / "\uFEFF"
    / Zs

WhiteSpace "whitespace" =
    PrimitiveWhiteSpace
    / LineTerminator PrimitiveWhiteSpace* ("*" / "///")

StartingWhiteSpace "whitespace" =
    PrimitiveWhiteSpace* LineTerminator? PrimitiveWhiteSpace* ("*" / "///")? __ 

// Separator, Space
Zs =
    [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

LineTerminator =
    [\n\r\u2028\u2029]

NonLineTerminator =
    [^\n\r\u2028\u2029]

LineTerminatorSequence "end of line" =
    "\n"
    / "\r\n"
    / "\r"
    / "\u2028"
    / "\u2029"

__ =
    (WhiteSpace / LineTerminator / Comment)*

// ==== Comments

EndOfLineComment = 
    "//" NonLineTerminator* { return text() }

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
