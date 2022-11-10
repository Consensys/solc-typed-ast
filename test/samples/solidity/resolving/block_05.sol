pragma solidity ^0.5.0;
contract Foo {
    struct foo {
        uint x;
    }
    
    function main() internal {
        foo memory m;
        
        uint foo = m.x;
        
        m.x = 1;
        
        foo = 2;
    }

    uint256 x1;
    uint256 x2;
    uint256 x3;
    uint256 x4;

    function second() internal {
        {
            uint256 x1 = 1;
            if (x1 > 0) {
                uint256 x2 = 2;
            }
            {
                uint256 x3 = 3;
            }
        }
        for (uint256 x4; x4 < 10; x4++) {}
        uint256 y = x1 + x2 + x3 + x4;
    }
}
