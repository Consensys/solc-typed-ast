Start
    = __  type: Type __ { return type; }

// Terminals
PrimitiveWhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / Zs

WhiteSpace "whitespace"
  = PrimitiveWhiteSpace

// Separator, Space
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"
__
  = (WhiteSpace / LineTerminator)*

TRUE = "true"
FALSE = "false"
OLD = "old"
LET = "let"
IN = "in"
BOOL = "bool"
ADDRESS = "address"
PAYABLE = "payable"
BYTES = "bytes"
STRING = "string"
BYTE = "byte"
MEMORY = "memory"
STORAGE = "storage"
CALLDATA = "calldata"
MAPPING = "mapping"
FUNCTION = "function"
RETURNS = "returns"
EXTERNAL = "external"
INTERNAL = "internal"
PURE = "pure"
VIEW = "view"
NONPAYABLE = "nonpayable"
INT_CONST = "int_const"
RATIONAL_CONST = "rational_const"
POINTER = "pointer"
REF = "ref"
TUPLE = "tuple"
TYPE = "type"
LITERAL_STRING = "literal_string"
MODIFIER = "modifier"
CONTRACT = "contract"
SUPER = "super"
LIBRARY = "library"
STRUCT = "struct"
ENUM = "enum"
MSG = "msg"
ABI = "abi"
BLOCK = "block"
TX = "tx"
SLICE = "slice"
CONSTANT = "constant"
HEX = "hex"
MODULE = "module"

Keyword
    = TRUE
    / FALSE
    / OLD
    / LET
    / IN
    / BOOL
    / ADDRESS
    / PAYABLE
    / BYTES
    / BYTE
    / MEMORY
    / STORAGE
    / CALLDATA
    / STRING
    / MAPPING
    / FUNCTION
    / RETURNS
    / EXTERNAL
    / INTERNAL
    / PURE
    / VIEW
    / NONPAYABLE
    / INT_CONST
    / RATIONAL_CONST 
    / TUPLE
    / TYPE
    / LITERAL_STRING
    / MODIFIER
    / CONTRACT
    / SUPER
    / LIBRARY
    / STRUCT
    / ENUM 
    / MSG
    / ABI
    / BLOCK
    / SLICE
    / TX
    / CONSTANT
    / HEX

StringLiteral
    = "'" chars: SingleStringChar* "'" { return [chars.join(""), false]; }
    / '"' chars: DoubleStringChar* '"' { return [chars.join(""), false]; }

HexLiteral
    = HEX '"' val: HexDigit* '"' { return [val.join(""), true]; }
    / HEX "'" val: HexDigit* "'" { return [val.join(""), true]; }

AnyChar
    = .

DoubleStringChar
    = !('"' / "\\" / LineTerminator) AnyChar { return text(); }
    / "\\" sequence: EscapeSequence { return sequence; }
    / LineContinuation

SingleStringChar
    = !("'" / "\\" / LineTerminator) AnyChar { return text(); }
    / "\\" sequence: EscapeSequence { return sequence; }
    / LineContinuation

LineContinuation
    = "\\" LineTerminatorSequence { return ""; }

EscapeSequence
    = CharEscapeSequence
    / "0" !DecDigit { return "\0"; }
    / HexEscapeSequence
    / UnicodeEscapeSequence

CharEscapeSequence
    = SingleEscapeChar
    / NonEscapeChar

SingleEscapeChar
    = "'"
    / '"'
    / "\\"
    / "b"  { return "\b"; }
    / "f"  { return "\f"; }
    / "n"  { return "\n"; }
    / "r"  { return "\r"; }
    / "t"  { return "\t"; }
    / "v"  { return "\v"; }

NonEscapeChar
    = !(EscapeChar / LineTerminator) AnyChar { return text(); }

HexDigit
    = [0-9a-f]i

DecDigit
    = [0-9]

EscapeChar
    = SingleEscapeChar
    / DecDigit
    / "x"
    / "u"

HexEscapeSequence
    = "x" digits:$(HexDigit HexDigit) { return String.fromCharCode(parseInt(digits, 16)); }

UnicodeEscapeSequence
    = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) { return String.fromCharCode(parseInt(digits, 16)); }

Identifier =
    !(Keyword [^a-zA-Z0-9_]) id:([a-zA-Z_][a-zA-Z$0-9_]*) { return text(); }

Word =
    id:([a-zA-Z_][a-zA-Z0-9$_]*) { return text(); }

Number =
    [0-9]+ { return parseInt(text()); }

MaybeNegNumber =
    sign: ("-"?) __ num: Number { return sign !== null ? -num : num; }


SimpleType
  = BoolType
  / AddressType
  / IntLiteralType
  / RationalLiteralType
  / StringLiteralType
  / IntType
  / BytesType
  / FixedSizeBytesType
  / StringType
  / UserDefinedType

StringLiteralErrorMsg = "(" [^\)]* ")" { return [undefined, false]; }
StringLiteralType = LITERAL_STRING __ literal:(StringLiteral / StringLiteralErrorMsg / HexLiteral) { return options.factory.makeStringLiteralTypeName(text(), literal[0], literal[1]); }
IntLiteralType = INT_CONST __ prefix: MaybeNegNumber ("...(" [^\)]* ")..." Number)? { return options.factory.makeIntLiteralTypeName(text(), prefix); }
RationalLiteralType = RATIONAL_CONST __ numerator: MaybeNegNumber __ "/" __ denominator: Number { throw new Error(`NYI Int literal type: ${text()}`); }

BoolType = BOOL { return options.factory.makeElementaryTypeName(text(), "bool"); }

AddressType = ADDRESS __ payable:(PAYABLE?) {
  return options.factory.makeElementaryTypeName(text(), "address", payable !== null ? "payable" : "nonpayable");
}

IntType = unsigned:("u"?) "int" width:(Number?) {
  return options.factory.makeElementaryTypeName(text(), text());
}

FixedSizeBytesType
  = BYTES width:Number { return options.factory.makeElementaryTypeName(text(), text()); }
  / BYTE               { return options.factory.makeElementaryTypeName(text(), text());}

BytesType = BYTES !Number { return options.factory.makeElementaryTypeName(text(), text()); }
StringType = STRING       { return options.factory.makeElementaryTypeName(text(), text()); }

FQName
  = Identifier ( "." Word )* { return text(); }

UserDefinedType
  = STRUCT __ name: FQName
  {
    return makeUserDefinedType(name, text(), options.version, StructDefinition, options.factory, options.ctx);
  }
  / ENUM __ name: FQName
  {
    return makeUserDefinedType(name, text(), options.version, EnumDefinition, options.factory, options.ctx);
  }
  / CONTRACT __ SUPER? __ name: FQName
  {
    return makeUserDefinedType(name, text(), options.version, ContractDefinition, options.factory, options.ctx);
  }
  / LIBRARY __ name: FQName
  {
    return makeUserDefinedType(name, text(), options.version, ContractDefinition, options.factory, options.ctx);
  }

MappingType
  = MAPPING __ "(" __ keyType: ArrayPtrType __ "=>" __ valueType: Type __ ")"  {
    return options.factory.makeMapping(text(), keyType, valueType)
  }

DataLocation = MEMORY / STORAGE / CALLDATA
PointerType = POINTER / REF / SLICE

TypeList
  = head: Type tail: (__ "," __ Type)*   { return tail.reduce((lst, cur) => { lst.push(cur[3]); return lst; }, [head]); }
  / __                                   { return []; }

MaybeTypeList
  = head: Type? &(__ ",") tail: (__ "," __ Type?)* { return tail.reduce((lst, cur) => { lst.push(cur[3]); return lst; }, [head]); }
  / __                                             { return []; }

FunctionVisibility = EXTERNAL / INTERNAL
FunctionMutability = PURE / VIEW / PAYABLE / NONPAYABLE / CONSTANT
FunctionDecorator = FunctionVisibility / FunctionMutability

FunctionDecoratorList
  = head: FunctionDecorator tail: (__ FunctionDecorator)* { return tail.reduce((acc, cur) => { acc.push(cur[1]); return acc}, [head])}

FunctionType
  = FUNCTION __ name: FQName? __ "(" __ args: TypeList? __ ")" __ decorators: (FunctionDecoratorList?) __ returns:(RETURNS __ "(" __ TypeList __ ")")? { 
    const retTypes = returns === null ? [] : returns[4];
    const [visibility, mutability] = getFunctionAttributes(decorators !== null ? decorators : []);
    return options.factory.makeFunctionTypeName(
      text(),
      visibility,
      mutability,
      makeParameterList(args, options.factory),
      makeParameterList(retTypes, options.factory));
}


ModifierType
  = MODIFIER __ "(" __ args: TypeList? __ ")" { throw new Error(`NYI modifier types - ${text()}`); }

TupleType
  = TUPLE __ "(" __  elements: MaybeTypeList __ ")" { return options.factory.makeTupleTypeName(text(), elements) }

TypeExprType
  = TYPE __ "(" innerT: Type ")" { return options.factory.makeTypeNameTypeName(text(), innerT); }

BuiltinTypes
  = name: MSG     { return options.factory.makeBuiltinStructTypeName(text(), name); }
  / name: ABI     { return options.factory.makeBuiltinStructTypeName(text(), name); }
  / name: BLOCK   { return options.factory.makeBuiltinStructTypeName(text(), name); }
  / name: TX      { return options.factory.makeBuiltinStructTypeName(text(), name); }

NonArrPtrType
  = MappingType
  / SimpleType
  / FunctionType

ArrayPtrType
  = head: NonArrPtrType tail: ( __ !PointerType "[" __ size: Number? __ "]" / __ storageLocation: (DataLocation) pointerType: (__ PointerType)?)*  {
    return tail.reduce((acc, cur) => {
      if (cur.length > 3) {
        const size = cur[4];
        const sizeExp = size !== null ? options.factory.makeLiteral(`int_const ${size}`, LiteralKind.Number, "", `${size}`) : undefined;
        const typeName = options.factory.makeArrayTypeName(text(), acc, sizeExp);
        return typeName;
      } else {
        const location = cur[1].trim() as DataLocation;
        let kind: string | undefined

        if (cur[2] !== null) {
          kind = cur[2][1].trim()
        }
        return options.factory.makeReferenceTypeName(text(), acc, location, kind)
      }
    }, head)
  }

ModuleType
  = MODULE __ path: StringLiteral { return options.factory.makeModuleTypeName(text(), path[0]) }

// Top-level rule
Type
  = ModifierType
  / TypeExprType
  / TupleType
  / BuiltinTypes
  / ArrayPtrType
  / ModuleType
