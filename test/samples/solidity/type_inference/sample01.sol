pragma solidity 0.6.6;

contract Test066 {
    uint8 constant WORD_SIZE = 32;

    function caseA(uint256 len) public {
        uint256 mask = 256 ** (WORD_SIZE - len) - 1;
    }

    function caseB() public {
        1_000_000_000 * (10 ** uint256(18));
    }
}
