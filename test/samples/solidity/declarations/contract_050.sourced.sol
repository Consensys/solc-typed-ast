// ------------------------------------------------------------
// test/samples/solidity/declarations/contract_050.sol
// ------------------------------------------------------------
library A {
    function add(uint a, uint b) public returns (uint c) {
        c = a + b;
    }
}

interface B {
    function some(uint a, uint b) external returns (uint);
}

contract C is B {
    using A for uint;

    enum En {
        A,
        B,
        C
    }

    event Ev(address indexed addr);

    struct St {
        uint a;
    }

    uint internal val;

    constructor() {
        val = some(1, 2);
    }

    function some(uint a, uint b) public returns (uint) {
        return a.add(b);
    }
}
