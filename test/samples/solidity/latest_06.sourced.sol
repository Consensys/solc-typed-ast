// ------------------------------------------------------------
// test/samples/solidity/latest_06.sol
// ------------------------------------------------------------
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
pragma experimental SMTChecker;

enum GlobalEnum {
    A,
    B,
    C
}

struct GlobalStruct {
    int a;
    uint[] b;
    mapping(address => uint) c;
    mapping(GlobalEnum => address) e;
    mapping(Empty => bool) d;
}

///  Sample library
///  Contains testSignedBaseExponentiation()
library SampleLibrary {
    function testSignedBaseExponentiation(int base, uint pow) public returns (int) {
        return (base ** pow);
    }
}

///  Sample interface
///  Contains infFunc() that returns `bytes memory`
interface SampleInterface {
    function infFunc(string calldata x) external returns (bytes memory);
}

abstract contract SampleAbstract {
    int internal some;

    ///  An abtract overridable modifier
    modifier abstractMod(int a) virtual;

    constructor(int v) public {
        some = v;
    }

    function abstractFunc(address a) virtual internal returns (address payable);
}

/// Empty contract
///  Just a stub
contract Empty {}

contract EmptyPayable {
    constructor() public payable {}
}

contract SampleBase is SampleAbstract(1) {
    /// Alert event for particular address
    event Alert(address entity, string message);

    uint internal constant constVar = 0;
    uint internal immutable immutableVar1 = 1;
    uint public immutable immutableVar2;
    uint[] internal data;

    ///  An implementation of the abstract modifier
    modifier abstractMod(int a) override {
        _;
        some += a;
    }

    ///  Modifier that requires `some` to be positive
    ///  before the function execution.
    modifier onlyPositiveSomeBefore() {
        require(some > 0, "Failure");
        _;
    }

    modifier alertingAfter(string memory message) {
        _;
        emit Alert(address(this), message);
    }

    constructor(uint v) public {
        immutableVar2 = v;
    }

    function abstractFunc(address a) override internal returns (address payable) {
        return payable(a);
    }

    function internalCallback() internal pure {}

    function testMinMax() public {
        assert(type(uint).min == 0);
        assert(type(uint).max == 115792089237316195423570985008687907853269984665640564039457584007913129639935);
        assert(type(int256).min == (-57896044618658097711785492504343953926634992332820282019728792003956564819968));
        assert(type(int256).max == 57896044618658097711785492504343953926634992332820282019728792003956564819967);
    }

    /// Interface ID (ERC-165)
    function testInterfaceId() public pure returns (bytes4) {
        return type(SampleInterface).interfaceId;
    }

    /// @dev tests calldata slicing
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
        try new EmptyPayable{salt: 0x0, value: 1 ether}() returns (EmptyPayable x) {
            int a = 1;
        } catch Error(string memory reason) {} catch (bytes memory lowLevelData) {}
    }

    function testGWei() public {
        assert(1 gwei == 1000000000 wei);
        assert(1 gwei == 0.001 szabo);
    }

    function basicFunctionality() internal onlyPositiveSomeBefore() returns (uint) {
        function(address) internal returns (address payable) converter = SampleBase.abstractFunc;
        function() internal pure sel = SampleBase.internalCallback;
        uint[] memory nums = new uint[](3);
        nums[0] = 1;
        nums[1] = 2;
        nums[2] = 3;
        GlobalStruct memory a = GlobalStruct(1, nums);
        uint[] memory x = a.b;
        delete a;
        uint y = x[1];
        delete x;
        return y;
    }

    function testSelectors() public {
        this.testSlices.selector;
        SampleLibrary.testSignedBaseExponentiation.selector;
        SampleInterface.infFunc.selector;
    }

    function testUnassignedStorage(uint[] memory x) internal returns (uint[] memory) {
        data = x;
        uint[] storage s;
        s = data;
        return s;
    }

    receive() external payable {}

    fallback() external {}
}

contract CallDataUsage {
    /// State variable doc string
    uint[] internal values;

    function returnRow(uint[][] calldata rows, uint index) private pure returns (uint[] calldata) {
        require(rows.length > index, "Rows does not contain index");
        /// Local varibale doc string
        uint[] calldata row = rows[index];
        return row;
    }

    function addOwners(uint[][] calldata rows) public {
        uint[] calldata row = returnRow(rows, 0);
        checkUnique(row);
        for (uint i = 0; i < row.length; i++) {
            values.push(row[i]);
        }
    }

    function checkUnique(uint[] calldata newValues) internal pure {
        for (uint i = 0; i < newValues.length; i++) {
            for (uint j = i + 1; i < newValues.length; j++) {
                require(newValues[i] != newValues[i]);
            }
        }
    }
}

interface SomeInterface {
    function addr() external pure returns (address payable);
}

contract PublicVarOverride is SomeInterface {
    ///  State variable overriding interface function by getter.
    address payable public immutable override addr = address(0x0);
}
