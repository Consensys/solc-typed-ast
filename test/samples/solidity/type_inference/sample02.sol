pragma solidity 0.8.16;

contract Test0816 {
    uint256 constant public A = 1;
    uint256 constant public B = A + 2;
    uint256 constant public C = 1 + B * 2;

    uint256[C] caseA;
    string[] caseB;

    constructor () public {
        caseA = [1, 2, 3, 4, 5, 6, 7];
        caseB = ["1", "2", "3"];
    }

    function caseC() public {
        string memory d = 1 > 2 ? "X" : "Y";
    }
}
