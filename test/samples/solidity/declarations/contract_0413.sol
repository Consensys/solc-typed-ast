library A {
    function add(uint a, uint b) public returns (uint c) {
        c = a + b;
    }
}

interface B {
    function some(uint a, uint b) public returns (uint);
}

contract C is B {
    event Ev(address indexed addr);

    struct St {
        uint a;
    }

    enum En {
        A, B, C
    }

    using A for uint;

    uint val;

    function C() public {
        val = some(1, 2);
    }

    function some(uint a, uint b) public returns (uint) {
        return a.add(b);
    }
}
