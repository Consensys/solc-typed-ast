pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
pragma experimental SMTChecker;

enum GlobalEnum { A, B, C }

struct GlobalStruct {
    int a;
    uint[] b;
    mapping(address => uint) c;
    mapping(GlobalEnum => address) e;
    mapping(Empty => bool) d;
}

/// Sample library
///   Contains testSignedBaseExponentiation()
library SampleLibrary {
    function testSignedBaseExponentiation(int base, uint pow) public returns (int) {
        return (base ** pow);
    }
}

/// Sample interface
///   Contains infFunc() that returns `bytes memory`
interface SampleInterface {
    function infFunc(string calldata x) external returns (bytes memory);
}

abstract contract SampleAbstract {
    int internal some;

    /// An abtract overridable modifier
    modifier abstractMod(int a) virtual;

    constructor(int v) public {
        some = v;
    }

    function abstractFunc(address a) virtual internal returns (address payable);
}

/// Empty contract
///   Just a stub
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

    /// An implementation of the abstract modifier
    modifier abstractMod(int a) override {
        _;
        some += a;
    }

    /// Modifier that requires `some` to be positive
    ///   before the function execution.
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
    /// State variable overriding interface function by getter.
    address payable public immutable override addr = address(0x0);
}
// PragmaDirective#1 (167:23:0) -> 0:23:0
// PragmaDirective#2 (191:33:0) -> 24:33:0
// PragmaDirective#3 (225:31:0) -> 58:31:0
// EnumValue#4 (276:1:0) -> 109:1:0
// EnumValue#5 (279:1:0) -> 112:1:0
// EnumValue#6 (282:1:0) -> 115:1:0
// EnumDefinition#7 (258:27:0) -> 91:27:0
// ElementaryTypeName#8 (313:3:0) -> 146:3:0
// VariableDeclaration#9 (313:5:0) -> 146:5:0
// ElementaryTypeName#10 (324:4:0) -> 157:4:0
// ArrayTypeName#11 (324:6:0) -> 157:6:0
// VariableDeclaration#12 (324:8:0) -> 157:8:0
// ElementaryTypeName#13 (346:7:0) -> 179:7:0
// ElementaryTypeName#14 (357:4:0) -> 190:4:0
// Mapping#15 (338:24:0) -> 171:24:0
// VariableDeclaration#16 (338:26:0) -> 171:26:0
// UserDefinedTypeName#17 (378:10:0) -> 211:10:0
// ElementaryTypeName#18 (392:7:0) -> 225:7:0
// Mapping#19 (370:30:0) -> 203:30:0
// VariableDeclaration#20 (370:32:0) -> 203:32:0
// UserDefinedTypeName#21 (416:5:0) -> 249:5:0
// ElementaryTypeName#22 (425:4:0) -> 258:4:0
// Mapping#23 (408:22:0) -> 241:22:0
// VariableDeclaration#24 (408:24:0) -> 241:24:0
// StructDefinition#25 (287:148:0) -> 120:148:0
// StructuredDocumentation#26 (437:65:0) -> 270:64:0
// ElementaryTypeName#27 (568:3:0) -> 401:3:0
// VariableDeclaration#28 (568:8:0) -> 401:8:0
// ElementaryTypeName#29 (578:4:0) -> 411:4:0
// VariableDeclaration#30 (578:8:0) -> 411:8:0
// ParameterList#31 (567:20:0) -> 400:20:0
// ElementaryTypeName#32 (604:3:0) -> 437:3:0
// VariableDeclaration#33 (604:3:0) -> 437:3:0
// ParameterList#34 (603:5:0) -> 436:5:0
// Identifier#35 (627:4:0) -> 460:4:0
// Identifier#36 (635:3:0) -> 468:3:0
// BinaryOperation#37 (627:11:0) -> 460:11:0
// TupleExpression#38 (626:13:0) -> 459:13:0
// Return#39 (619:20:0) -> 452:20:0
// Block#40 (609:37:0) -> 442:37:0
// FunctionDefinition#41 (530:116:0) -> 363:116:0
// ContractDefinition#42 (502:146:0) -> 335:146:0
// StructuredDocumentation#43 (650:74:0) -> 483:73:0
// ElementaryTypeName#44 (773:6:0) -> 606:6:0
// VariableDeclaration#45 (773:17:0) -> 606:17:0
// ParameterList#46 (772:19:0) -> 605:19:0
// ElementaryTypeName#47 (810:5:0) -> 643:5:0
// VariableDeclaration#48 (810:12:0) -> 643:12:0
// ParameterList#49 (809:14:0) -> 642:14:0
// FunctionDefinition#50 (756:68:0) -> 589:68:0
// ContractDefinition#51 (724:102:0) -> 557:102:0
// ElementaryTypeName#52 (867:3:0) -> 700:3:0
// VariableDeclaration#53 (867:17:0) -> 700:17:0
// StructuredDocumentation#54 (891:36:0) -> 724:35:0
// ElementaryTypeName#55 (953:3:0) -> 785:3:0
// VariableDeclaration#56 (953:5:0) -> 785:5:0
// ParameterList#57 (952:7:0) -> 784:7:0
// ModifierDefinition#58 (932:36:0) -> 764:36:0
// ElementaryTypeName#59 (986:3:0) -> 818:3:0
// VariableDeclaration#60 (986:5:0) -> 818:5:0
// ParameterList#61 (985:7:0) -> 817:7:0
// Identifier#63 (1010:4:0) -> 842:4:0
// Identifier#64 (1017:1:0) -> 849:1:0
// Assignment#65 (1010:8:0) -> 842:8:0
// ExpressionStatement#66 (1010:8:0) -> 842:8:0
// Block#67 (1000:25:0) -> 832:25:0
// FunctionDefinition#68 (974:51:0) -> 806:51:0
// ElementaryTypeName#69 (1053:7:0) -> 885:7:0
// VariableDeclaration#70 (1053:9:0) -> 885:9:0
// ParameterList#71 (1052:11:0) -> 884:11:0
// ElementaryTypeName#72 (1090:15:0) -> 922:15:0
// VariableDeclaration#73 (1090:15:0) -> 922:15:0
// ParameterList#74 (1089:17:0) -> 921:17:0
// FunctionDefinition#75 (1031:76:0) -> 863:76:0
// ContractDefinition#76 (828:281:0) -> 661:280:0
// StructuredDocumentation#77 (1111:36:0) -> 943:36:0
// ContractDefinition#78 (1147:17:0) -> 980:17:0
// ParameterList#79 (1205:2:0) -> 1038:2:0
// Block#81 (1223:2:0) -> 1056:2:0
// FunctionDefinition#82 (1194:31:0) -> 1027:31:0
// ContractDefinition#83 (1166:61:0) -> 999:61:0
// UserDefinedTypeName#84 (1252:14:0) -> 1085:14:0
// Literal#85 (1267:1:0) -> 1100:1:0
// InheritanceSpecifier#86 (1252:17:0) -> 1085:17:0
// StructuredDocumentation#87 (1276:38:0) -> 1109:38:0
// ElementaryTypeName#88 (1331:7:0) -> 1164:7:0
// VariableDeclaration#89 (1331:14:0) -> 1164:14:0
// ElementaryTypeName#90 (1347:6:0) -> 1180:6:0
// VariableDeclaration#91 (1347:14:0) -> 1180:14:0
// ParameterList#92 (1330:32:0) -> 1163:32:0
// EventDefinition#93 (1319:44:0) -> 1152:44:0
// ElementaryTypeName#94 (1369:4:0) -> 1202:4:0
// Literal#95 (1403:1:0) -> 1236:1:0
// VariableDeclaration#96 (1369:35:0) -> 1202:35:0
// ElementaryTypeName#97 (1410:4:0) -> 1243:4:0
// Literal#98 (1450:1:0) -> 1283:1:0
// VariableDeclaration#99 (1410:41:0) -> 1243:41:0
// ElementaryTypeName#100 (1457:4:0) -> 1290:4:0
// VariableDeclaration#101 (1457:35:0) -> 1290:35:0
// ElementaryTypeName#102 (1498:4:0) -> 1331:4:0
// ArrayTypeName#103 (1498:6:0) -> 1331:6:0
// VariableDeclaration#104 (1498:20:0) -> 1331:20:0
// StructuredDocumentation#105 (1525:47:0) -> 1358:46:0
// ElementaryTypeName#106 (1598:3:0) -> 1430:3:0
// VariableDeclaration#107 (1598:5:0) -> 1430:5:0
// ParameterList#108 (1597:7:0) -> 1429:7:0
// OverrideSpecifier#109 (1605:8:0) -> 1437:8:0
// PlaceholderStatement#110 (1624:1:0) -> 1456:1:0
// Identifier#111 (1635:4:0) -> 1467:4:0
// Identifier#112 (1643:1:0) -> 1475:1:0
// Assignment#113 (1635:9:0) -> 1467:9:0
// ExpressionStatement#114 (1635:9:0) -> 1467:9:0
// Block#115 (1614:37:0) -> 1446:37:0
// ModifierDefinition#116 (1577:74:0) -> 1409:74:0
// StructuredDocumentation#117 (1657:89:0) -> 1489:89:0
// ParameterList#118 (1782:2:0) -> 1614:2:0
// Identifier#119 (1795:7:0) -> 1627:7:0
// Identifier#120 (1803:4:0) -> 1635:4:0
// Literal#121 (1810:1:0) -> 1642:1:0
// BinaryOperation#122 (1803:8:0) -> 1635:8:0
// Literal#123 (1813:9:0) -> 1645:9:0
// FunctionCall#124 (1795:28:0) -> 1627:28:0
// ExpressionStatement#125 (1795:28:0) -> 1627:28:0
// PlaceholderStatement#126 (1833:1:0) -> 1665:1:0
// Block#127 (1785:56:0) -> 1617:56:0
// ModifierDefinition#128 (1751:90:0) -> 1583:90:0
// ElementaryTypeName#129 (1870:6:0) -> 1702:6:0
// VariableDeclaration#130 (1870:21:0) -> 1702:21:0
// ParameterList#131 (1869:23:0) -> 1701:23:0
// PlaceholderStatement#132 (1903:1:0) -> 1735:1:0
// Identifier#133 (1919:5:0) -> 1751:5:0
// ElementaryTypeName#134 (1925:7:0) -> 1757:7:0
// ElementaryTypeNameExpression#135 (1925:7:0) -> 1757:7:0
// Identifier#136 (1933:4:0) -> 1765:4:0
// FunctionCall#137 (1925:13:0) -> 1757:13:0
// Identifier#138 (1940:7:0) -> 1772:7:0
// FunctionCall#139 (1919:29:0) -> 1751:29:0
// EmitStatement#140 (1914:34:0) -> 1746:34:0
// Block#141 (1893:62:0) -> 1725:62:0
// ModifierDefinition#142 (1847:108:0) -> 1679:108:0
// ElementaryTypeName#143 (1973:4:0) -> 1805:4:0
// VariableDeclaration#144 (1973:6:0) -> 1805:6:0
// ParameterList#145 (1972:8:0) -> 1804:8:0
// Identifier#147 (1998:13:0) -> 1830:13:0
// Identifier#148 (2014:1:0) -> 1846:1:0
// Assignment#149 (1998:17:0) -> 1830:17:0
// ExpressionStatement#150 (1998:17:0) -> 1830:17:0
// Block#151 (1988:34:0) -> 1820:34:0
// FunctionDefinition#152 (1961:61:0) -> 1793:61:0
// ElementaryTypeName#153 (2050:7:0) -> 1882:7:0
// VariableDeclaration#154 (2050:9:0) -> 1882:9:0
// ParameterList#155 (2049:11:0) -> 1881:11:0
// OverrideSpecifier#156 (2061:8:0) -> 1893:8:0
// ElementaryTypeName#157 (2088:15:0) -> 1920:15:0
// VariableDeclaration#158 (2088:15:0) -> 1920:15:0
// ParameterList#159 (2087:17:0) -> 1919:17:0
// ElementaryTypeName#160 (2122:8:0) -> 1954:7:0
// ElementaryTypeNameExpression#161 (2122:8:0) -> 1954:7:0
// Identifier#162 (2130:1:0) -> 1962:1:0
// FunctionCall#163 (2122:10:0) -> 1954:10:0
// Return#164 (2115:17:0) -> 1947:17:0
// Block#165 (2105:34:0) -> 1937:34:0
// FunctionDefinition#166 (2028:111:0) -> 1860:111:0
// ParameterList#167 (2170:2:0) -> 2002:2:0
// Block#169 (2187:2:0) -> 2019:2:0
// FunctionDefinition#170 (2145:44:0) -> 1977:44:0
// ParameterList#171 (2214:2:0) -> 2046:2:0
// Identifier#173 (2234:6:0) -> 2066:6:0
// Identifier#174 (2241:4:0) -> 2073:4:0
// ElementaryTypeName#175 (2246:4:0) -> 2078:4:0
// ElementaryTypeNameExpression#176 (2246:4:0) -> 2078:4:0
// FunctionCall#177 (2241:10:0) -> 2073:10:0
// MemberAccess#178 (2241:14:0) -> 2073:14:0
// Literal#179 (2259:1:0) -> 2091:1:0
// BinaryOperation#180 (2241:19:0) -> 2073:19:0
// FunctionCall#181 (2234:27:0) -> 2066:27:0
// ExpressionStatement#182 (2234:27:0) -> 2066:27:0
// Identifier#183 (2271:6:0) -> 2103:6:0
// Identifier#184 (2278:4:0) -> 2110:4:0
// ElementaryTypeName#185 (2283:4:0) -> 2115:4:0
// ElementaryTypeNameExpression#186 (2283:4:0) -> 2115:4:0
// FunctionCall#187 (2278:10:0) -> 2110:10:0
// MemberAccess#188 (2278:14:0) -> 2110:14:0
// Literal#189 (2296:78:0) -> 2128:78:0
// BinaryOperation#190 (2278:96:0) -> 2110:96:0
// FunctionCall#191 (2271:104:0) -> 2103:104:0
// ExpressionStatement#192 (2271:104:0) -> 2103:104:0
// Identifier#193 (2385:6:0) -> 2217:6:0
// Identifier#194 (2392:4:0) -> 2224:4:0
// ElementaryTypeName#195 (2397:6:0) -> 2229:6:0
// ElementaryTypeNameExpression#196 (2397:6:0) -> 2229:6:0
// FunctionCall#197 (2392:12:0) -> 2224:12:0
// MemberAccess#198 (2392:16:0) -> 2224:16:0
// Literal#199 (2414:77:0) -> 2246:77:0
// UnaryOperation#200 (2413:78:0) -> 2245:78:0
// TupleExpression#201 (2412:80:0) -> 2244:80:0
// BinaryOperation#202 (2392:100:0) -> 2224:100:0
// FunctionCall#203 (2385:108:0) -> 2217:108:0
// ExpressionStatement#204 (2385:108:0) -> 2217:108:0
// Identifier#205 (2503:6:0) -> 2335:6:0
// Identifier#206 (2510:4:0) -> 2342:4:0
// ElementaryTypeName#207 (2515:6:0) -> 2347:6:0
// ElementaryTypeNameExpression#208 (2515:6:0) -> 2347:6:0
// FunctionCall#209 (2510:12:0) -> 2342:12:0
// MemberAccess#210 (2510:16:0) -> 2342:16:0
// Literal#211 (2530:77:0) -> 2362:77:0
// BinaryOperation#212 (2510:97:0) -> 2342:97:0
// FunctionCall#213 (2503:105:0) -> 2335:105:0
// ExpressionStatement#214 (2503:105:0) -> 2335:105:0
// Block#215 (2224:391:0) -> 2056:391:0
// FunctionDefinition#216 (2195:420:0) -> 2027:420:0
// StructuredDocumentation#217 (2621:26:0) -> 2453:26:0
// ParameterList#218 (2676:2:0) -> 2508:2:0
// ElementaryTypeName#219 (2700:6:0) -> 2532:6:0
// VariableDeclaration#220 (2700:6:0) -> 2532:6:0
// ParameterList#221 (2699:8:0) -> 2531:8:0
// Identifier#222 (2725:4:0) -> 2557:4:0
// Identifier#223 (2730:15:0) -> 2562:15:0
// FunctionCall#224 (2725:21:0) -> 2557:21:0
// MemberAccess#225 (2725:33:0) -> 2557:33:0
// Return#226 (2718:40:0) -> 2550:40:0
// Block#227 (2708:57:0) -> 2540:57:0
// FunctionDefinition#228 (2652:113:0) -> 2484:113:0
// StructuredDocumentation#229 (2771:31:0) -> 2603:31:0
// ParameterList#230 (2826:2:0) -> 2658:2:0
// ElementaryTypeName#232 (2852:4:0) -> 2684:4:0
// VariableDeclaration#233 (2852:6:0) -> 2684:6:0
// ElementaryTypeName#234 (2860:4:0) -> 2692:4:0
// VariableDeclaration#235 (2860:6:0) -> 2692:6:0
// Identifier#236 (2870:3:0) -> 2702:3:0
// MemberAccess#237 (2870:10:0) -> 2702:10:0
// Identifier#238 (2881:3:0) -> 2713:3:0
// MemberAccess#239 (2881:8:0) -> 2713:8:0
// Literal#240 (2890:1:0) -> 2722:1:0
// Literal#241 (2892:1:0) -> 2724:1:0
// IndexRangeAccess#242 (2881:13:0) -> 2713:13:0
// ElementaryTypeName#243 (2897:4:0) -> 2729:4:0
// ElementaryTypeNameExpression#244 (2897:4:0) -> 2729:4:0
// ElementaryTypeName#245 (2903:4:0) -> 2735:4:0
// ElementaryTypeNameExpression#246 (2903:4:0) -> 2735:4:0
// TupleExpression#247 (2896:12:0) -> 2728:12:0
// FunctionCall#248 (2870:39:0) -> 2702:39:0
// VariableDeclarationStatement#249 (2851:58:0) -> 2683:58:0
// ElementaryTypeName#250 (2920:4:0) -> 2752:4:0
// VariableDeclaration#251 (2920:6:0) -> 2752:6:0
// ElementaryTypeName#252 (2928:4:0) -> 2760:4:0
// VariableDeclaration#253 (2928:6:0) -> 2760:6:0
// Identifier#254 (2938:3:0) -> 2770:3:0
// MemberAccess#255 (2938:10:0) -> 2770:10:0
// Identifier#256 (2949:3:0) -> 2781:3:0
// MemberAccess#257 (2949:8:0) -> 2781:8:0
// Literal#258 (2959:1:0) -> 2791:1:0
// IndexRangeAccess#259 (2949:12:0) -> 2781:12:0
// ElementaryTypeName#260 (2964:4:0) -> 2796:4:0
// ElementaryTypeNameExpression#261 (2964:4:0) -> 2796:4:0
// ElementaryTypeName#262 (2970:4:0) -> 2802:4:0
// ElementaryTypeNameExpression#263 (2970:4:0) -> 2802:4:0
// TupleExpression#264 (2963:12:0) -> 2795:12:0
// FunctionCall#265 (2938:38:0) -> 2770:38:0
// VariableDeclarationStatement#266 (2919:57:0) -> 2751:57:0
// ElementaryTypeName#267 (2987:4:0) -> 2819:4:0
// VariableDeclaration#268 (2987:6:0) -> 2819:6:0
// ElementaryTypeName#269 (2995:4:0) -> 2827:4:0
// VariableDeclaration#270 (2995:6:0) -> 2827:6:0
// Identifier#271 (3005:3:0) -> 2837:3:0
// MemberAccess#272 (3005:10:0) -> 2837:10:0
// Identifier#273 (3016:3:0) -> 2848:3:0
// MemberAccess#274 (3016:8:0) -> 2848:8:0
// Literal#275 (3025:1:0) -> 2857:1:0
// IndexRangeAccess#276 (3016:12:0) -> 2848:12:0
// ElementaryTypeName#277 (3031:4:0) -> 2863:4:0
// ElementaryTypeNameExpression#278 (3031:4:0) -> 2863:4:0
// ElementaryTypeName#279 (3037:4:0) -> 2869:4:0
// ElementaryTypeNameExpression#280 (3037:4:0) -> 2869:4:0
// TupleExpression#281 (3030:12:0) -> 2862:12:0
// FunctionCall#282 (3005:38:0) -> 2837:38:0
// VariableDeclarationStatement#283 (2986:57:0) -> 2818:57:0
// ElementaryTypeName#284 (3054:4:0) -> 2886:4:0
// VariableDeclaration#285 (3054:6:0) -> 2886:6:0
// ElementaryTypeName#286 (3062:4:0) -> 2894:4:0
// VariableDeclaration#287 (3062:6:0) -> 2894:6:0
// Identifier#288 (3072:3:0) -> 2904:3:0
// MemberAccess#289 (3072:10:0) -> 2904:10:0
// Identifier#290 (3083:3:0) -> 2915:3:0
// MemberAccess#291 (3083:8:0) -> 2915:8:0
// IndexRangeAccess#292 (3083:11:0) -> 2915:11:0
// ElementaryTypeName#293 (3097:4:0) -> 2929:4:0
// ElementaryTypeNameExpression#294 (3097:4:0) -> 2929:4:0
// ElementaryTypeName#295 (3103:4:0) -> 2935:4:0
// ElementaryTypeNameExpression#296 (3103:4:0) -> 2935:4:0
// TupleExpression#297 (3096:12:0) -> 2928:12:0
// FunctionCall#298 (3072:37:0) -> 2904:37:0
// VariableDeclarationStatement#299 (3053:56:0) -> 2885:56:0
// ElementaryTypeName#300 (3120:4:0) -> 2952:4:0
// VariableDeclaration#301 (3120:6:0) -> 2952:6:0
// ElementaryTypeName#302 (3128:4:0) -> 2960:4:0
// VariableDeclaration#303 (3128:6:0) -> 2960:6:0
// Identifier#304 (3138:3:0) -> 2970:3:0
// MemberAccess#305 (3138:10:0) -> 2970:10:0
// Identifier#306 (3149:3:0) -> 2981:3:0
// MemberAccess#307 (3149:8:0) -> 2981:8:0
// ElementaryTypeName#308 (3160:4:0) -> 2992:4:0
// ElementaryTypeNameExpression#309 (3160:4:0) -> 2992:4:0
// ElementaryTypeName#310 (3166:4:0) -> 2998:4:0
// ElementaryTypeNameExpression#311 (3166:4:0) -> 2998:4:0
// TupleExpression#312 (3159:12:0) -> 2991:12:0
// FunctionCall#313 (3138:34:0) -> 2970:34:0
// VariableDeclarationStatement#314 (3119:53:0) -> 2951:53:0
// Block#315 (2841:338:0) -> 2673:338:0
// FunctionDefinition#316 (2807:372:0) -> 2639:372:0
// ParameterList#317 (3206:2:0) -> 3038:2:0
// Identifier#318 (3216:13:0) -> 3048:13:0
// Literal#319 (3230:25:0) -> 3062:25:0
// ModifierInvocation#320 (3216:40:0) -> 3048:40:0
// UserDefinedTypeName#322 (3275:5:0) -> 3107:5:0
// NewExpression#323 (3271:9:0) -> 3103:9:0
// FunctionCall#324 (3271:11:0) -> 3103:11:0
// ElementaryTypeName#325 (3297:3:0) -> 3129:3:0
// VariableDeclaration#326 (3297:5:0) -> 3129:5:0
// Literal#327 (3305:1:0) -> 3137:1:0
// VariableDeclarationStatement#328 (3297:9:0) -> 3129:9:0
// Block#329 (3283:34:0) -> 3115:34:0
// TryCatchClause#330 (3283:34:0) -> 3115:34:0
// ElementaryTypeName#331 (3338:3:0) -> 3170:3:0
// VariableDeclaration#332 (3338:5:0) -> 3170:5:0
// Literal#333 (3346:1:0) -> 3178:1:0
// VariableDeclarationStatement#334 (3338:9:0) -> 3170:9:0
// Block#335 (3324:34:0) -> 3156:34:0
// TryCatchClause#336 (3318:40:0) -> 3150:40:0
// TryStatement#337 (3267:91:0) -> 3099:91:0
// UserDefinedTypeName#338 (3375:12:0) -> 3207:12:0
// NewExpression#339 (3371:16:0) -> 3203:16:0
// Literal#340 (3394:3:0) -> 3226:3:0
// Literal#341 (3406:7:0) -> 3238:7:0
// FunctionCallOptions#342 (3371:43:0) -> 3203:43:0
// FunctionCall#343 (3371:45:0) -> 3203:45:0
// UserDefinedTypeName#344 (3426:12:0) -> 3258:12:0
// VariableDeclaration#345 (3426:14:0) -> 3258:14:0
// ParameterList#346 (3425:16:0) -> 3257:16:0
// ElementaryTypeName#347 (3456:3:0) -> 3288:3:0
// VariableDeclaration#348 (3456:5:0) -> 3288:5:0
// Literal#349 (3464:1:0) -> 3296:1:0
// VariableDeclarationStatement#350 (3456:9:0) -> 3288:9:0
// Block#351 (3442:34:0) -> 3274:34:0
// TryCatchClause#352 (3417:59:0) -> 3249:59:0
// ElementaryTypeName#353 (3489:6:0) -> 3321:6:0
// VariableDeclaration#354 (3489:20:0) -> 3321:20:0
// ParameterList#355 (3488:22:0) -> 3320:22:0
// Block#356 (3511:2:0) -> 3343:2:0
// TryCatchClause#357 (3477:36:0) -> 3309:36:0
// ElementaryTypeName#358 (3521:5:0) -> 3353:5:0
// VariableDeclaration#359 (3521:25:0) -> 3353:25:0
// ParameterList#360 (3520:27:0) -> 3352:27:0
// Block#361 (3548:2:0) -> 3380:2:0
// TryCatchClause#362 (3514:36:0) -> 3346:36:0
// TryStatement#363 (3367:183:0) -> 3199:183:0
// Block#364 (3257:299:0) -> 3089:299:0
// FunctionDefinition#365 (3185:371:0) -> 3017:371:0
// ParameterList#366 (3579:2:0) -> 3411:2:0
// Identifier#368 (3599:6:0) -> 3431:6:0
// Literal#369 (3606:6:0) -> 3438:6:0
// Literal#370 (3616:14:0) -> 3448:14:0
// BinaryOperation#371 (3606:24:0) -> 3438:24:0
// FunctionCall#372 (3599:32:0) -> 3431:32:0
// ExpressionStatement#373 (3599:32:0) -> 3431:32:0
// Identifier#374 (3641:6:0) -> 3473:6:0
// Literal#375 (3648:6:0) -> 3480:6:0
// Literal#376 (3658:11:0) -> 3490:11:0
// BinaryOperation#377 (3648:21:0) -> 3480:21:0
// FunctionCall#378 (3641:29:0) -> 3473:29:0
// ExpressionStatement#379 (3641:29:0) -> 3473:29:0
// Block#380 (3589:88:0) -> 3421:88:0
// FunctionDefinition#381 (3562:115:0) -> 3394:115:0
// ParameterList#382 (3710:2:0) -> 3542:2:0
// Identifier#383 (3722:22:0) -> 3554:22:0
// ModifierInvocation#384 (3722:24:0) -> 3554:24:0
// ElementaryTypeName#385 (3756:4:0) -> 3588:4:0
// VariableDeclaration#386 (3756:4:0) -> 3588:4:0
// ParameterList#387 (3755:6:0) -> 3587:6:0
// ElementaryTypeName#388 (3781:7:0) -> 3613:7:0
// VariableDeclaration#389 (3781:7:0) -> 3613:7:0
// ParameterList#390 (3780:9:0) -> 3612:9:0
// ElementaryTypeName#391 (3808:15:0) -> 3640:15:0
// VariableDeclaration#392 (3808:15:0) -> 3640:15:0
// ParameterList#393 (3807:17:0) -> 3639:17:0
// FunctionTypeName#394 (3772:62:0) -> 3604:52:0
// VariableDeclaration#395 (3772:62:0) -> 3604:62:0
// Identifier#396 (3837:10:0) -> 3669:10:0
// MemberAccess#397 (3837:23:0) -> 3669:23:0
// VariableDeclarationStatement#398 (3772:88:0) -> 3604:88:0
// ParameterList#399 (3878:2:0) -> 3710:2:0
// FunctionTypeName#401 (3870:28:0) -> 3702:24:0
// VariableDeclaration#402 (3870:28:0) -> 3702:28:0
// Identifier#403 (3901:10:0) -> 3733:10:0
// MemberAccess#404 (3901:27:0) -> 3733:27:0
// VariableDeclarationStatement#405 (3870:58:0) -> 3702:58:0
// ElementaryTypeName#408 (3938:4:0) -> 3770:4:0
// ArrayTypeName#409 (3938:6:0) -> 3770:6:0
// VariableDeclaration#410 (3938:18:0) -> 3770:18:0
// ElementaryTypeName#411 (3963:4:0) -> 3795:4:0
// ArrayTypeName#412 (3963:6:0) -> 3795:6:0
// NewExpression#413 (3959:10:0) -> 3791:10:0
// Literal#414 (3970:1:0) -> 3802:1:0
// FunctionCall#415 (3959:13:0) -> 3791:13:0
// VariableDeclarationStatement#416 (3938:34:0) -> 3770:34:0
// Identifier#417 (3982:4:0) -> 3814:4:0
// Literal#418 (3987:1:0) -> 3819:1:0
// IndexAccess#419 (3982:7:0) -> 3814:7:0
// Literal#420 (3992:1:0) -> 3824:1:0
// Assignment#421 (3982:11:0) -> 3814:11:0
// ExpressionStatement#422 (3982:11:0) -> 3814:11:0
// Identifier#423 (4003:4:0) -> 3835:4:0
// Literal#424 (4008:1:0) -> 3840:1:0
// IndexAccess#425 (4003:7:0) -> 3835:7:0
// Literal#426 (4013:1:0) -> 3845:1:0
// Assignment#427 (4003:11:0) -> 3835:11:0
// ExpressionStatement#428 (4003:11:0) -> 3835:11:0
// Identifier#429 (4024:4:0) -> 3856:4:0
// Literal#430 (4029:1:0) -> 3861:1:0
// IndexAccess#431 (4024:7:0) -> 3856:7:0
// Literal#432 (4034:1:0) -> 3866:1:0
// Assignment#433 (4024:11:0) -> 3856:11:0
// ExpressionStatement#434 (4024:11:0) -> 3856:11:0
// UserDefinedTypeName#435 (4045:12:0) -> 3877:12:0
// VariableDeclaration#436 (4045:21:0) -> 3877:21:0
// Identifier#437 (4069:12:0) -> 3901:12:0
// Literal#438 (4082:1:0) -> 3914:1:0
// Identifier#439 (4085:4:0) -> 3917:4:0
// FunctionCall#440 (4069:21:0) -> 3901:21:0
// VariableDeclarationStatement#441 (4045:45:0) -> 3877:45:0
// ElementaryTypeName#444 (4100:4:0) -> 3932:4:0
// ArrayTypeName#445 (4100:6:0) -> 3932:6:0
// VariableDeclaration#446 (4100:15:0) -> 3932:15:0
// Identifier#447 (4118:1:0) -> 3950:1:0
// MemberAccess#448 (4118:3:0) -> 3950:3:0
// VariableDeclarationStatement#449 (4100:21:0) -> 3932:21:0
// Identifier#450 (4138:1:0) -> 3970:1:0
// UnaryOperation#451 (4131:8:0) -> 3963:8:0
// ExpressionStatement#452 (4131:8:0) -> 3963:8:0
// ElementaryTypeName#453 (4149:4:0) -> 3981:4:0
// VariableDeclaration#454 (4149:6:0) -> 3981:6:0
// Identifier#455 (4158:1:0) -> 3990:1:0
// Literal#456 (4160:1:0) -> 3992:1:0
// IndexAccess#457 (4158:4:0) -> 3990:4:0
// VariableDeclarationStatement#458 (4149:13:0) -> 3981:13:0
// Identifier#459 (4179:1:0) -> 4011:1:0
// UnaryOperation#460 (4172:8:0) -> 4004:8:0
// ExpressionStatement#461 (4172:8:0) -> 4004:8:0
// Identifier#462 (4197:1:0) -> 4029:1:0
// Return#463 (4190:8:0) -> 4022:8:0
// Block#464 (3762:443:0) -> 3594:443:0
// FunctionDefinition#465 (3683:522:0) -> 3515:522:0
// ParameterList#466 (4233:2:0) -> 4065:2:0
// Identifier#468 (4253:4:0) -> 4085:4:0
// MemberAccess#471 (4253:15:0) -> 4085:15:0
// MemberAccess#472 (4253:24:0) -> 4085:24:0
// ExpressionStatement#473 (4253:24:0) -> 4085:24:0
// Identifier#474 (4287:13:0) -> 4119:13:0
// MemberAccess#477 (4287:42:0) -> 4119:42:0
// MemberAccess#478 (4287:51:0) -> 4119:51:0
// ExpressionStatement#479 (4287:51:0) -> 4119:51:0
// Identifier#480 (4348:15:0) -> 4180:15:0
// MemberAccess#483 (4348:23:0) -> 4180:23:0
// MemberAccess#484 (4348:32:0) -> 4180:32:0
// ExpressionStatement#485 (4348:32:0) -> 4180:32:0
// Block#486 (4243:144:0) -> 4075:144:0
// FunctionDefinition#487 (4211:176:0) -> 4043:176:0
// ElementaryTypeName#488 (4424:4:0) -> 4256:4:0
// ArrayTypeName#489 (4424:6:0) -> 4256:6:0
// VariableDeclaration#490 (4424:15:0) -> 4256:15:0
// ParameterList#491 (4423:17:0) -> 4255:17:0
// ElementaryTypeName#492 (4459:4:0) -> 4291:4:0
// ArrayTypeName#493 (4459:6:0) -> 4291:6:0
// VariableDeclaration#494 (4459:13:0) -> 4291:13:0
// ParameterList#495 (4458:15:0) -> 4290:15:0
// Identifier#496 (4484:4:0) -> 4316:4:0
// Identifier#497 (4491:1:0) -> 4323:1:0
// Assignment#498 (4484:8:0) -> 4316:8:0
// ExpressionStatement#499 (4484:8:0) -> 4316:8:0
// ElementaryTypeName#502 (4502:4:0) -> 4334:4:0
// ArrayTypeName#503 (4502:6:0) -> 4334:6:0
// VariableDeclaration#504 (4502:16:0) -> 4334:16:0
// VariableDeclarationStatement#505 (4502:16:0) -> 4334:16:0
// Identifier#506 (4528:1:0) -> 4360:1:0
// Identifier#507 (4532:4:0) -> 4364:4:0
// Assignment#508 (4528:8:0) -> 4360:8:0
// ExpressionStatement#509 (4528:8:0) -> 4360:8:0
// Identifier#510 (4553:1:0) -> 4385:1:0
// Return#511 (4546:8:0) -> 4378:8:0
// Block#512 (4474:87:0) -> 4306:87:0
// FunctionDefinition#513 (4393:168:0) -> 4225:168:0
// ParameterList#514 (4574:2:0) -> 4406:2:0
// Block#516 (4594:2:0) -> 4426:2:0
// FunctionDefinition#517 (4567:29:0) -> 4399:29:0
// ParameterList#518 (4610:2:0) -> 4442:2:0
// Block#520 (4622:2:0) -> 4454:2:0
// FunctionDefinition#521 (4602:22:0) -> 4434:22:0
// ContractDefinition#522 (1229:3397:0) -> 1062:3396:0
// StructuredDocumentation#523 (4657:29:0) -> 4489:29:0
// ElementaryTypeName#524 (4691:4:0) -> 4523:4:0
// ArrayTypeName#525 (4691:6:0) -> 4523:6:0
// VariableDeclaration#526 (4691:22:0) -> 4523:22:0
// ElementaryTypeName#527 (4739:4:0) -> 4571:4:0
// ArrayTypeName#528 (4739:6:0) -> 4571:6:0
// ArrayTypeName#529 (4739:8:0) -> 4571:8:0
// VariableDeclaration#530 (4739:22:0) -> 4571:22:0
// ElementaryTypeName#531 (4763:4:0) -> 4595:4:0
// VariableDeclaration#532 (4763:10:0) -> 4595:10:0
// ParameterList#533 (4738:36:0) -> 4570:36:0
// ElementaryTypeName#534 (4797:4:0) -> 4629:4:0
// ArrayTypeName#535 (4797:6:0) -> 4629:6:0
// VariableDeclaration#536 (4797:15:0) -> 4629:15:0
// ParameterList#537 (4796:17:0) -> 4628:17:0
// Identifier#538 (4824:7:0) -> 4656:7:0
// Identifier#539 (4832:4:0) -> 4664:4:0
// MemberAccess#540 (4832:11:0) -> 4664:11:0
// Identifier#541 (4846:5:0) -> 4678:5:0
// BinaryOperation#542 (4832:19:0) -> 4664:19:0
// Literal#543 (4853:29:0) -> 4685:29:0
// FunctionCall#544 (4824:59:0) -> 4656:59:0
// ExpressionStatement#545 (4824:59:0) -> 4656:59:0
// ElementaryTypeName#548 (4931:4:0) -> 4725:4:0
// ArrayTypeName#549 (4931:6:0) -> 4725:6:0
// VariableDeclaration#550 (4931:19:0) -> 4725:19:0
// Identifier#551 (4953:4:0) -> 4747:4:0
// Identifier#552 (4958:5:0) -> 4752:5:0
// IndexAccess#553 (4953:11:0) -> 4747:11:0
// VariableDeclarationStatement#554 (4931:33:0) -> 4725:33:0
// Identifier#555 (4981:3:0) -> 4775:3:0
// Return#556 (4974:10:0) -> 4768:10:0
// Block#557 (4814:177:0) -> 4646:139:0
// FunctionDefinition#558 (4720:271:0) -> 4552:233:0
// ElementaryTypeName#559 (5016:4:0) -> 4810:4:0
// ArrayTypeName#560 (5016:6:0) -> 4810:6:0
// ArrayTypeName#561 (5016:8:0) -> 4810:8:0
// VariableDeclaration#562 (5016:22:0) -> 4810:22:0
// ParameterList#563 (5015:24:0) -> 4809:24:0
// ElementaryTypeName#567 (5057:4:0) -> 4851:4:0
// ArrayTypeName#568 (5057:6:0) -> 4851:6:0
// VariableDeclaration#569 (5057:19:0) -> 4851:19:0
// Identifier#570 (5079:9:0) -> 4873:9:0
// Identifier#571 (5089:4:0) -> 4883:4:0
// Literal#572 (5095:1:0) -> 4889:1:0
// FunctionCall#573 (5079:18:0) -> 4873:18:0
// VariableDeclarationStatement#574 (5057:40:0) -> 4851:40:0
// Identifier#575 (5107:11:0) -> 4901:11:0
// Identifier#576 (5119:3:0) -> 4913:3:0
// FunctionCall#577 (5107:16:0) -> 4901:16:0
// ExpressionStatement#578 (5107:16:0) -> 4901:16:0
// ElementaryTypeName#579 (5138:4:0) -> 4932:4:0
// VariableDeclaration#580 (5138:6:0) -> 4932:6:0
// Literal#581 (5147:1:0) -> 4941:1:0
// VariableDeclarationStatement#582 (5138:10:0) -> 4932:10:0
// Identifier#583 (5150:1:0) -> 4944:1:0
// Identifier#584 (5154:3:0) -> 4948:3:0
// MemberAccess#585 (5154:10:0) -> 4948:10:0
// BinaryOperation#586 (5150:14:0) -> 4944:14:0
// Identifier#587 (5166:1:0) -> 4960:1:0
// UnaryOperation#588 (5166:3:0) -> 4960:3:0
// ExpressionStatement#589 (5166:3:0) -> 4960:3:0
// Identifier#590 (5185:6:0) -> 4979:6:0
// MemberAccess#592 (5185:11:0) -> 4979:11:0
// Identifier#593 (5197:3:0) -> 4991:3:0
// Identifier#594 (5201:1:0) -> 4995:1:0
// IndexAccess#595 (5197:6:0) -> 4991:6:0
// FunctionCall#596 (5185:19:0) -> 4979:19:0
// ExpressionStatement#597 (5185:19:0) -> 4979:19:0
// Block#598 (5171:44:0) -> 4965:44:0
// ForStatement#599 (5133:82:0) -> 4927:82:0
// Block#600 (5047:174:0) -> 4841:174:0
// FunctionDefinition#601 (4997:224:0) -> 4791:224:0
// ElementaryTypeName#602 (5248:4:0) -> 5042:4:0
// ArrayTypeName#603 (5248:6:0) -> 5042:6:0
// VariableDeclaration#604 (5248:25:0) -> 5042:25:0
// ParameterList#605 (5247:27:0) -> 5041:27:0
// ElementaryTypeName#607 (5304:4:0) -> 5098:4:0
// VariableDeclaration#608 (5304:6:0) -> 5098:6:0
// Literal#609 (5313:1:0) -> 5107:1:0
// VariableDeclarationStatement#610 (5304:10:0) -> 5098:10:0
// Identifier#611 (5316:1:0) -> 5110:1:0
// Identifier#612 (5320:9:0) -> 5114:9:0
// MemberAccess#613 (5320:16:0) -> 5114:16:0
// BinaryOperation#614 (5316:20:0) -> 5110:20:0
// Identifier#615 (5338:1:0) -> 5132:1:0
// UnaryOperation#616 (5338:3:0) -> 5132:3:0
// ExpressionStatement#617 (5338:3:0) -> 5132:3:0
// ElementaryTypeName#618 (5362:4:0) -> 5156:4:0
// VariableDeclaration#619 (5362:6:0) -> 5156:6:0
// Identifier#620 (5371:1:0) -> 5165:1:0
// Literal#621 (5375:1:0) -> 5169:1:0
// BinaryOperation#622 (5371:5:0) -> 5165:5:0
// VariableDeclarationStatement#623 (5362:14:0) -> 5156:14:0
// Identifier#624 (5378:1:0) -> 5172:1:0
// Identifier#625 (5382:9:0) -> 5176:9:0
// MemberAccess#626 (5382:16:0) -> 5176:16:0
// BinaryOperation#627 (5378:20:0) -> 5172:20:0
// Identifier#628 (5400:1:0) -> 5194:1:0
// UnaryOperation#629 (5400:3:0) -> 5194:3:0
// ExpressionStatement#630 (5400:3:0) -> 5194:3:0
// Identifier#631 (5423:7:0) -> 5217:7:0
// Identifier#632 (5431:9:0) -> 5225:9:0
// Identifier#633 (5441:1:0) -> 5235:1:0
// IndexAccess#634 (5431:12:0) -> 5225:12:0
// Identifier#635 (5447:9:0) -> 5241:9:0
// Identifier#636 (5457:1:0) -> 5251:1:0
// IndexAccess#637 (5447:12:0) -> 5241:12:0
// BinaryOperation#638 (5431:28:0) -> 5225:28:0
// FunctionCall#639 (5423:37:0) -> 5217:37:0
// ExpressionStatement#640 (5423:37:0) -> 5217:37:0
// Block#641 (5405:70:0) -> 5199:70:0
// ForStatement#642 (5357:118:0) -> 5151:118:0
// Block#643 (5343:142:0) -> 5137:142:0
// ForStatement#644 (5299:186:0) -> 5093:186:0
// Block#645 (5289:202:0) -> 5083:202:0
// FunctionDefinition#646 (5227:264:0) -> 5021:264:0
// ContractDefinition#647 (4628:865:0) -> 4460:827:0
// ParameterList#648 (5538:2:0) -> 5332:2:0
// ElementaryTypeName#649 (5564:15:0) -> 5358:15:0
// VariableDeclaration#650 (5564:15:0) -> 5358:15:0
// ParameterList#651 (5563:17:0) -> 5357:17:0
// FunctionDefinition#652 (5525:56:0) -> 5319:56:0
// ContractDefinition#653 (5495:88:0) -> 5289:88:0
// UserDefinedTypeName#654 (5615:13:0) -> 5409:13:0
// InheritanceSpecifier#655 (5615:13:0) -> 5409:13:0
// StructuredDocumentation#656 (5635:60:0) -> 5429:59:0
// ElementaryTypeName#657 (5700:15:0) -> 5493:15:0
// OverrideSpecifier#658 (5733:8:0) -> 5526:8:0
// ElementaryTypeName#659 (5749:7:0) -> 5542:7:0
// ElementaryTypeNameExpression#660 (5749:7:0) -> 5542:7:0
// Literal#661 (5757:3:0) -> 5550:3:0
// FunctionCall#662 (5749:12:0) -> 5542:12:0
// VariableDeclaration#663 (5700:61:0) -> 5493:61:0
// ContractDefinition#664 (5585:179:0) -> 5379:178:0
// SourceUnit#665 (167:5598:0) -> 0:5557:0
