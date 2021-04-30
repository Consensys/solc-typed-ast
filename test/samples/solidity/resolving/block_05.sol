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
}
