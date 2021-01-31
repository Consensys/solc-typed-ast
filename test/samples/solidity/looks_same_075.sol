pragma solidity 0.7.5;

contract Test {
    uint internal i = 1;

    function main() public {
        uint i = 1;
        i = 1;
        {
            i = 1;
        }
        i = 1;
        i = 1;
    }
}
