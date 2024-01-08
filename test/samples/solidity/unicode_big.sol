pragma solidity 0.8.22;
pragma abicoder v2;

/**
 * Struct
 * 😀😀😀😀😀😀😀😀😀😀😀
 * Doc
 */
struct Some {
    uint x;

    /**
     * Struct 😀😀😀😀😀😀😀😀😀😀😀
     *  Dangling
     *   Doc
     */
}

/**😀😀😀😀😀😀😀😀😀😀😀
 * Enum 
 * Doc
 */
enum EnumABC {
    A, B, C

    /**
     * Enum
     *  Dangling
     *   Doc
     */
}

contract UncheckedMathExample {
    function test() public pure returns (uint) {
        uint x = 0;

        unchecked {
            x--;
        }

        return x;
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

        try c.test() {
            
        } catch Error(string memory reason) {
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
    event Ev(uint a);

    enum EnumXYZ {
        X, Y, Z
    }

    modifier modStructDocs() {
        /// PlaceholderState😀😀😀😀😀😀😀😀😀😀😀ment docstring
        _;
    }

    function stmtStructDocs() modStructDocs() public {
        /// VariableDeclarationStatement docstring
        (uint a) = (1);

        /// Expression😀😀😀😀😀😀😀😀😀😀😀Statement docstring
        1;

        /// Block docstring
        {}

        /// EmitStatement doc😀😀😀😀😀😀😀😀😀😀😀string
        emit Ev(1);

        /// WhileStatement docstring
        while(false)
        /// Body Block docstring
        {
            /// Continue docstring
            continue;
        }

        /// DoWhile😀😀😀😀😀😀😀😀😀😀😀Statement docstring
        do
        /// Body Block docstring
        {
            /// Break docstring
            break;
        }
        while(true);

        /// ForStatement docstring
        for (
            /// Init VariableDeclarati😀😀😀😀😀😀😀😀😀😀😀onStatement docstring
            (uint n) = (1);
            /// Expression docstring
            n < 1;
            /// Post-lo😀😀😀😀😀😀😀😀😀😀😀op ExpressionStatement docstring
            n++
        ) 
        /// Body😀😀😀😀😀😀😀😀😀😀😀 Block docstring
        {}

        /// IfStatement docstring
        if (false)
        /// True body Block docstring
        {}
        else
        /// False body Block docstring
        {}

        CatchPanic cp = new CatchPanic();

        /// TryStatement docstring
        try cp.test()
        /// Call TryCatchClause Block docstring
        {}
        /// Error TryCatchClause docstring
        catch Error(string memory reason)
        /// Error TryCatchClause Block docstring
        {}
        /// Panic TryCatchClause docstring
        catch Panic(uint _code)
        /// Panic TryCatchClau😀😀😀😀😀😀😀😀😀😀😀se Block docstring
        {}
        /// Fallback TryCatchClause docstring
        catch
        /// Fallback TryCatchClause Block docstring
        {}

        /// InlineAssembly docstring
        assembly {}

        /// UncheckedBlock docstring
        unchecked {}

        /// Return😀😀😀😀😀😀😀😀😀😀😀 docstring
        return;
    }
}

/// UnitLevelError e😀😀😀😀😀😀😀😀😀😀😀rror docstring
error UnitLevelError084(uint code);

library LibErrors084 {
    /// LibErrors084.Li😀😀😀😀😀😀😀😀😀😀😀b error docstring
    error Lib(bytes b);
}

contract Features084 {
    /// Features😀😀😀😀😀😀😀😀😀😀😀084.Own error docstring
    error Own();

    function testAssemblyHexLiterals() public {
        assembly {
            let a := "test"
            let x := hex"112233445566778899aabbccddeeff6677889900"
            let y := hex"1234_abcd"
            let z := "\xc3"

            sstore(0, x)
            sstore(1, y)

            pop(hex"2233")
        }
    }

    function testBytesConcatBuiltin(bytes memory a, bytes memory b) public pure returns (bytes memory c) {
        return bytes.concat(a, b);
    }

    function testVariableDeclarationStatementDocString() public {
        /// VariableDeclar😀😀😀😀😀😀😀😀😀😀😀ationStatement docstring
        uint a = 10;
    }

    function revertWithLib() public {
        /// RevertSt😀😀😀😀😀😀😀😀😀😀😀atement docstring
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

type Price is uint128;
type Quantity is uint128;

library LibWithUDVT_088 {
    type UFixed is uint256;

    uint constant multiplier = 10**18;

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
    /// Interface😀😀😀😀😀😀😀😀😀😀😀WithUDTV_088.EntityReference docstring
    type EntityReference is address payable;

    function balance(EntityReference er) external view returns(uint);
}

contract EnumTypeMinMax_088 {
    function testEnumMinMax() public pure {
        assert(type(EnumABC).min == EnumABC.A);
        assert(type(EnumABC).max == EnumABC.C);
    }
}

contract ExternalFnSelectorAndAddress_0810 {
    function testFunction() external {}

    function test(address newAddress, uint32 newSelector) view public returns (address adr, bytes4 sel) {
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

contract Builtins_0811 {
    function some(uint a, int b, bytes2 c) external pure returns(bytes2 x, int y, uint z) {
        return (c, b, a);
    }

    function test() public view {
        bytes memory payload = abi.encodeCall(this.some, (1, -1, 0xFFFF));
    }
}

contract Features_0812 {
    function () external externalStorage;

    function comparePtr() public {
        function () external externalLocal1;
        function () external externalLocal2;

        externalLocal1 == externalLocal2;
        externalLocal1 != externalLocal2;

        externalLocal1 == externalStorage;
        externalStorage != externalLocal2;

        abi.encodeCall(Builtins_0811.some, (1, -1, 0x0102));

        string memory a = "abc";
        string memory b = "def";
        string memory c = string.concat(a, b);
    }
}

type RestrictedNumber_0813 is int256;

using A_0813 for RestrictedNumber_0813;
using { plusOne, minusOne, A_0813.add } for RestrictedNumber_0813 global;

function plusOne(RestrictedNumber_0813 x) pure returns (RestrictedNumber_0813) {
    unchecked {
        return RestrictedNumber_0813.wrap(RestrictedNumber_0813.unwrap(x) + 1);
    }
}

function minusOne(RestrictedNumber_0813 x) pure returns (RestrictedNumber_0813) {
    unchecked {
        return RestrictedNumber_0813.wrap(RestrictedNumber_0813.unwrap(x) - 1);
    }
}

function createRestrictedNumber_0813(int256 value) pure returns (RestrictedNumber_0813) {
    require((value <= 100) && ((-value) <= 100));
    return RestrictedNumber_0813.wrap(value);
}

library A_0813 {
    function add(RestrictedNumber_0813 a, RestrictedNumber_0813 b) internal returns (RestrictedNumber_0813 c) {
        c = RestrictedNumber_0813.wrap(RestrictedNumber_0813.unwrap(a) + RestrictedNumber_0813.unwrap(b));
    }
}

contract Features_0813 {
    function memorySafeAsm() public {
        assembly ("memory-safe") {}
        /// @solidity memory-safe-assembly
        assembly {}
    }
}

contract Features_0815 {
    event SomeEvent(address indexed addr, uint indexed v);
    error SomeError(address addr, uint v);

    function privateFunc(uint x) private pure returns (uint z) {}

    function checkSelectors() pure public returns (bytes32 ev, bytes4 er) {
        ev = SomeEvent.selector;
        er = SomeError.selector;

        privateFunc(1);

        assert(ev == 0xdde371250dcd21c331edbb965b9163f4898566e8c60e28868533281edf66ab03);
        assert(er == 0x399802c9);
    }
}


interface IntEvents {
    event X(uint a);
}

library LibEvents {
    event X(uint a);
}

event X(uint a);
event Y(uint a) anonymous;

contract Features_0822 {
    event X(uint a);

    function main() public {
        emit IntEvents.X(1);
        emit LibEvents.X(2);
        /**
         * Both followin😀😀😀😀😀😀😀😀😀😀😀g emits are referring to an event
         * that is defined by contract (due to shadowing).
         */
        emit X(3);
        emit Features_0822.X(4);

        emit Y(5);
    }
}
