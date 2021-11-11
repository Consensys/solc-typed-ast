// ------------------------------------------------------------
// /test/samples/solidity/latest_08.sol
// ------------------------------------------------------------
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./latest_imports_08.sol" as LI;

enum EnumABC { A, B, C }

type Price is uint128;

type Quantity is uint128;

/// UnitLevelError error docstring
error UnitLevelError084(uint code);

contract UncheckedMathExample {
    function test() public pure returns (uint) {
        uint x = 0;
        unchecked {
            x--;
        }
        return x;
    }
}

contract EmitsIdentifierPath is LI.SomeContract {
    using LI.SomeLib for LI.SomeContract.SomeStruct;

    constructor() LI.SomeContract() {}

    function test() public {
        LI.SomeContract.SomeStruct memory s = LI.SomeContract.SomeStruct(10);
    }

    function some() override(LI.SomeContract) public returns (uint) {
        return 2;
    }
}

contract UsesNewAddressMembers {
    function test() public {
        bytes memory code = address(0).code;
        bytes32 codeHash = address(0).codehash;
    }
}

contract CatchPanic {
    function test() public {
        UsesNewAddressMembers c = new UsesNewAddressMembers();
        try c.test() {} catch Error(string memory reason) {
            revert(reason);
        } catch Panic(uint _code) {
            if (_code == 0x01) {
                revert("Assertion failed");
            } else if (_code == 0x11) {
                revert("Underflow/overflow");
            }
        } catch {
            revert("Internal error");
        }
    }
}

contract Features082 {
    enum EnumXYZ { X, Y, Z }

    event Ev(uint a);

    modifier modStructDocs() {
        /// PlaceholderStatement docstring
        _;
    }

    function stmtStructDocs() public modStructDocs() {
        /// VariableDeclarationStatement docstring
        uint a = (1);
        /// ExpressionStatement docstring
        1;
        /// Block docstring
        {}
        /// EmitStatement docstring
        emit Ev(1);
        /// WhileStatement docstring
        while (false) /// Body Block docstring
        {
            /// Continue docstring
            continue;
        }
        /// DoWhileStatement docstring
        do /// Body Block docstring
        {
            /// Break docstring
            break;
        } while(true);
        /// ForStatement docstring
        for (/// Init VariableDeclarationStatement docstring
        uint n = (1); n < 1; /// Post-loop ExpressionStatement docstring
        n++) /// Body Block docstring
        {}
        /// IfStatement docstring
        if (false) /// True body Block docstring
        {} else /// False body Block docstring
        {}
        CatchPanic cp = new CatchPanic();
        /// TryStatement docstring
        try cp.test() /// Call TryCatchClause Block docstring
        {} /// Error TryCatchClause docstring
        catch Error(string memory reason) /// Error TryCatchClause Block docstring
        {} /// Panic TryCatchClause docstring
        catch Panic(uint _code) /// Panic TryCatchClause Block docstring
        {} /// Fallback TryCatchClause docstring
        catch /// Fallback TryCatchClause Block docstring
        {}
        /// InlineAssembly docstring
        assembly {}
        /// UncheckedBlock docstring
        unchecked {}
        /// Return docstring
        return;
    }
}

library LibErrors084 {
    /// LibErrors084.Lib error docstring
    error Lib(bytes b);
}

contract Features084 {
    /// Features084.Own error docstring
    error Own();

    function testAssemblyHexLiterals() public {
        assembly {
            let a := "test"
            let x := hex"112233445566778899aabbccddeeff6677889900"
            let y := hex"1234abcd"
            sstore(0, x)
            sstore(1, y)
            pop("\"3")
        }
    }

    function testBytesConcatBuiltin(bytes memory a, bytes memory b) public pure returns (bytes memory c) {
        return bytes.concat(a, b);
    }

    function testVariableDeclarationStatementDocString() public {
        /// VariableDeclarationStatement docstring
        uint a = 10;
    }

    function revertWithLib() public {
        /// RevertStatement docstring
        revert LibErrors084.Lib(hex"001122");
    }

    function revertWithOwn() public {
        revert Own();
    }

    function revertWithUnitLevelError() public {
        revert UnitLevelError084(1);
    }
}

contract Features087 {
    function basefeeGlobal() external view returns (uint) {
        return block.basefee;
    }

    function basefeeInlineAssembly() external view returns (uint ret) {
        assembly {
            ret := basefee()
        }
    }
}

library LibWithUDVT_088 {
    type UFixed is uint256;

    uint internal constant multiplier = 10 ** 18;

    function add(UFixed a, UFixed b) internal pure returns (UFixed) {
        return UFixed.wrap(UFixed.unwrap(a) + UFixed.unwrap(b));
    }

    function mul(UFixed a, uint256 b) internal pure returns (UFixed) {
        return UFixed.wrap(UFixed.unwrap(a) * b);
    }

    function floor(UFixed a) internal pure returns (uint256) {
        return UFixed.unwrap(a) / multiplier;
    }

    function toUFixed(uint256 a) internal pure returns (UFixed) {
        return UFixed.wrap(a * multiplier);
    }
}

interface InterfaceWithUDTV_088 {
    type EntityReference is address payable;

    function balance(EntityReference er) external view returns (uint);
}

contract EnumTypeMinMax_088 {
    function testEnumMinMax() public pure {
        assert(type(EnumABC).min == EnumABC.A);
        assert(type(EnumABC).max == EnumABC.C);
    }
}

contract ExternalFnSelectorAndAddress_0810 {
    function testFunction() external {}

    function test(address newAddress, uint32 newSelector) public view returns (address adr, bytes4 sel) {
        function() external fp = this.testFunction;
        assembly {
            let o := fp.address
            let s := fp.selector
            fp.address := newAddress
            fp.selector := newSelector
        }
        return (fp.address, fp.selector);
    }
}
// ------------------------------------------------------------
// /test/samples/solidity/latest_imports_08.sol
// ------------------------------------------------------------
pragma solidity ^0.8.0;
pragma abicoder v2;

contract SomeContract {
    struct SomeStruct {
        uint n;
    }

    function some() virtual public returns (uint) {
        return 1;
    }
}

library SomeLib {}
