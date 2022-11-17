import { DataLocation } from "../ast/constants";
import {
    BoolType,
    FixedBytesType,
    PointerType,
    StringType,
    BytesType,
    AddressType,
    IntType,
    TupleType,
    BuiltinFunctionType,
    U256Type
} from "./ast";

// Helper with some singleton types to avoid unnecessary allocations
export const types = {
    bool: new BoolType(),
    uint256: new IntType(256, false),
    uint160: new IntType(160, false),
    uint8: new IntType(8, false),
    byte: new FixedBytesType(1),
    bytes4: new FixedBytesType(4),
    bytes20: new FixedBytesType(20),
    bytes32: new FixedBytesType(32),
    stringMemory: new PointerType(new StringType(), DataLocation.Memory),
    bytesMemory: new PointerType(new BytesType(), DataLocation.Memory),
    bytesCalldata: new PointerType(new BytesType(), DataLocation.CallData),
    address: new AddressType(false),
    addressPayable: new AddressType(true),
    noType: new TupleType([]),
    typeOfType: new BuiltinFunctionType(undefined, [], [])
};

export const yulTypes = {
    u256: new U256Type(undefined)
};
