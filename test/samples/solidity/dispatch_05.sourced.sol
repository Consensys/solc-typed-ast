// ------------------------------------------------------------
// /home/blitz/development/solc-typed-ast/test/samples/solidity/dispatch_05.sol
// ------------------------------------------------------------
pragma solidity ^0.5.0;

contract A {
    event Ev();

    uint public v;

    modifier mod() {
        _;
    }

    function overloaded(uint8 a, uint8 b) public pure returns (uint) {
        return a + b;
    }

    function overloaded(uint8 a) public pure returns (uint) {
        return overloaded(a, 1);
    }

    function fn() public {}

    function vars() public {
        A.v = 0;
        v = 0;
    }

    function events() public {
        emit A.Ev();
        emit Ev();
    }

    function mods() public mod() {}

    function fns() public {
        A.fn();
        this.fn();
        fn();
    }

    function getters() public {
        this.v();
        v;
    }
}

contract B is A {
    event Ev();

    uint public v;

    modifier mod() {
        _;
    }

    function overloaded() public pure returns (uint) {
        return overloaded(1, 1);
    }

    function fn() public {}

    function vars() public {
        A.v = 1;
        B.v = 2;
        v = 3;
    }

    function events() public {
        emit A.Ev();
        emit B.Ev();
        emit Ev();
    }

    function mods() public mod() {}

    function fns() public {
        A.fn();
        super.fn();
        B.fn();
        this.fn();
        fn();
    }

    function getters() public {
        this.v();
        v;
    }
}

contract C is B {}

contract D {
    A internal a = new A();
    B internal b = new B();

    function callOverloaded() public view {
        b.overloaded(1, 2);
        b.overloaded(1);
        b.overloaded();
    }

    function getters() public view {
        a.v();
        b.v();
    }
}

interface I {
    function v() external returns (uint);
}
