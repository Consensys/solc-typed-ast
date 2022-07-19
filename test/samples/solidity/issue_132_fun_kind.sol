pragma solidity 0.4.24;

contract FBNoArgs {
    int8 public lastCall = 0;
    
    function() external payable {
        lastCall = 1;
    }
    
    function id(uint x) public returns (uint) {
        lastCall = 2;
        return x;
    }
}

