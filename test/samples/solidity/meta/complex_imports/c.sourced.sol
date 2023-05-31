// ------------------------------------------------------------
// test/samples/solidity/meta/complex_imports/a.sol
// ------------------------------------------------------------
enum SomeEnum {
    A,
    B,
    C
}

struct SomeStruct {
    uint x;
    uint y;
}

uint256 constant SOME_CONST = 10;

function someFn() {}

contract SomeContract {}
// ------------------------------------------------------------
// test/samples/solidity/meta/complex_imports/b.sol
// ------------------------------------------------------------
import "./a.sol" as Util;
import { SOME_CONST, SomeStruct, SomeEnum, someFn, SomeContract } from "./a.sol";
import { SOME_CONST as OTHER_CONST, SomeStruct as OtherStruct, SomeEnum as OtherEnum, someFn as otherFn, SomeContract as OtherContract } from "./a.sol";
// ------------------------------------------------------------
// test/samples/solidity/meta/complex_imports/c.sol
// ------------------------------------------------------------
pragma solidity ^0.7.4;

import { Util as OtherUtil } from "./b.sol";
import { OTHER_CONST, OtherStruct, OtherEnum, otherFn, OtherContract } from "./b.sol";
import { OTHER_CONST as ANOTHER_CONST, OtherStruct as AnotherStruct, OtherEnum as AnotherEnum, otherFn as anotherFn, OtherContract as AnotherContract } from "./b.sol";
