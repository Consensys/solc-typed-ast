pragma solidity ^0.8.0;

uint constant x1 = 1;

contract Foo {
    uint x1 = x1 + 1;
    uint x2;
    uint x3;
    uint x4;
    uint x5;
    
    uint tmp = x1+x2+x3+x4+x5;
    
    function foo(uint x1, uint x2) public moo(x1) returns (uint x5) {
        uint x2 = x2+1;
        uint t = x5;
        for(uint x2 = x2; x2 < x3; x2++) {
            uint x3 = 1+x3;
        }
        
        if (x1<2) 
            if (x2>2)
                if (x3>3)
                    x4 = 3;
                else
                    {
                        uint x4 = x4;
                    }
                    
        try this.foo(1,2) returns (uint x5) {
            return x5;
        } catch Error(string memory reason) {
            revert(reason);
        } catch Panic(uint code) {
            if (code == 0x01) {
                revert("Assertion failed");
            } else if (code == 0x11) {
                revert("Underflow/overflow");
            }
        } catch {
            revert("Internal error");
        }
        
        for (x2 = 0; x2<1; x2++) {
            x5 = x2;
        }
    }
    
    function varDecls() public  {
        (uint x1, uint x2) = (1, 2);
        
        {
            uint x1 = x1 + 2;
            if (x1 < 0){
                uint x1  =x1 + 3;
            } else {
                uint x1 = x1 + 4;
            }
        }
    }
    
    modifier moo(uint x1) {
        x2 += x1;
        _;
    }
}