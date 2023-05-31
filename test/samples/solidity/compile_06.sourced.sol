// ------------------------------------------------------------
// test/samples/solidity/compile_06.sol
// ------------------------------------------------------------
pragma solidity ^0.6.0;

enum GlobalEnum {
    A,
    B,
    C
}

struct GlobalStruct {
    int a;
    uint[] b;
    mapping(address => uint) c;
}

library SampleLibrary {
    function testSignedBaseExponentiation(int base, uint pow) public returns (int) {
        return base ** pow;
    }
}

abstract contract SampleAbstract {
    function abstractFunc(address a) virtual internal returns (address payable);
}

contract Empty {}

contract SampleBase is SampleAbstract {
    event Alert(address entity, string message);

    modifier alertingAfter(string memory message) {
        _;
        emit Alert(address(this), message);
    }

    function abstractFunc(address a) override(SampleAbstract) internal returns (address payable) {
        return payable(a);
    }

    function testSlices() public pure {
        (uint a, uint b) = abi.decode(msg.data[0:4], (uint, uint));
        (uint c, uint d) = abi.decode(msg.data[:4], (uint, uint));
        (uint e, uint f) = abi.decode(msg.data[4:], (uint, uint));
        (uint g, uint h) = abi.decode(msg.data[:], (uint, uint));
        (uint i, uint j) = abi.decode(msg.data, (uint, uint));
    }

    function testTryCatch() public alertingAfter("Other contract creation") {
        try new Empty() {
            int a = 1;
        } catch {
            int b = 2;
        }
        try new Empty() returns (Empty x) {
            int a = 1;
        } catch Error(string memory reason) {} catch (bytes memory lowLevelData) {}
    }

    constructor() public {}

    receive() external payable {}

    fallback() external {}
}
