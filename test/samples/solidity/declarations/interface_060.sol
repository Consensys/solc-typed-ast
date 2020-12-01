pragma solidity ^0.6.0;

interface A {
    function doA(uint arg) external returns (uint ret);
}

interface B is A {
    function doB(uint arg) external returns (uint ret);
}

interface C {}

contract Test is B {
    uint x;
    uint public y;

    mapping (address => uint) public m;
    address[] public n;

    constructor(uint v) public {
        y = x = v;
    }

    function doA(uint a) override public returns (uint r) {
        r = a + 1;
    }

    function doB(uint a) override public returns (uint) {
        y++;

        uint upd = doA(x + a);
        address sender = msg.sender;

        m[sender] = upd;

        n.push(sender);

        return upd;
    }
}
