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
