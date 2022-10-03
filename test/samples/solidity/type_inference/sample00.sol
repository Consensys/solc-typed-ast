pragma solidity 0.5.14;

contract Check {
    function foo(uint x, bytes calldata b) external pure returns (string memory) {
        return string(b);
    }
    function bar(address payable a) external pure {}
    function baz(bytes calldata _data) external returns (bool);

    bytes sB;
    string sS;

    function main() public {
        sS = string(sB);
    }
}

contract Test0514 {
    Check c;
    uint8 v;

    function decimals() internal pure returns (uint8) {
        return 6;
    }

    function caseA() public {
        c.foo(123, hex"c0ffee");
    }

    function caseB() public {
        c.bar(address(uint160(0x01)));
    }

    function caseC() public {
        uint256 dec = 2_000_000 * (10 ** decimals());
    }

    function caseD() public {
        c.baz;
    }

    function caseE() public {
        1 > 2 ? string(abi.encodePacked("xyz")) : "";
    }

    string s = "abc";

    function caseF() public {
        1 > 2 ? s : "";
    }
}
