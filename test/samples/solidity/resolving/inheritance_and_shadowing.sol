pragma solidity ^0.8.0;

contract Base {
    struct foo {
        uint X;
    }
    //function foo() internal {}
}

uint constant foo = 1;

contract Child is Base {
    function main() public {
        //uint x = foo;
    }
}
