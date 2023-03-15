pragma solidity ^0.8.0;
pragma abicoder v2;

contract SomeContract {
    struct SomeStruct {
        uint n;
    }

    function some() public virtual returns(uint) {
        return 1;
    }
}

library SomeLib {}

type Int is int;

using {add as +, neg as -} for Int global;

function neg(Int a) pure returns (Int) {
    return Int.wrap(-Int.unwrap(a));
}

function add(Int a, Int b) pure returns (Int) {
    return Int.wrap(Int.unwrap(a) + Int.unwrap(b));
}
