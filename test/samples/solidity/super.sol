pragma solidity 0.8.5;

contract Base1 {
    event E1();
    error Err1();
    struct S1 {
        uint x;
    }
    function b1() internal {}
}

contract Base2 {
    event E2();
    error Err2();
    struct S2 {
        uint y;
    }
    function b2() internal {}
}

contract Child is Base1, Base2 {
    function main() public {
        super.b1;
        super.b2;
        //super doesn't work with events
        //super.E1;
        //super.E2;

        //super doesn't work with errors
        //super.Err1;
        //super.Err2;

        //super doesn't work with typeDefs
        //super.S1;
        //super.S2;

    }
}

