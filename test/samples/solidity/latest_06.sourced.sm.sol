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
// PragmaDirective#1 (168:23:0) -> 0:23:0
// PragmaDirective#2 (192:33:0) -> 24:33:0
// PragmaDirective#3 (226:31:0) -> 58:31:0
// EnumValue#4 (277:1:0) -> 109:1:0
// EnumValue#5 (280:1:0) -> 112:1:0
// EnumValue#6 (283:1:0) -> 115:1:0
// EnumDefinition#7 (259:27:0) -> 91:27:0
// ElementaryTypeName#8 (314:3:0) -> 146:3:0
// VariableDeclaration#9 (314:5:0) -> 146:5:0
// ElementaryTypeName#10 (325:4:0) -> 157:4:0
// ArrayTypeName#11 (325:6:0) -> 157:6:0
// VariableDeclaration#12 (325:8:0) -> 157:8:0
// ElementaryTypeName#13 (347:7:0) -> 179:7:0
// ElementaryTypeName#14 (358:4:0) -> 190:4:0
// Mapping#15 (339:24:0) -> 171:24:0
// VariableDeclaration#16 (339:26:0) -> 171:26:0
// UserDefinedTypeName#17 (379:10:0) -> 211:10:0
// ElementaryTypeName#18 (393:7:0) -> 225:7:0
// Mapping#19 (371:30:0) -> 203:30:0
// VariableDeclaration#20 (371:32:0) -> 203:32:0
// UserDefinedTypeName#21 (417:5:0) -> 249:5:0
// ElementaryTypeName#22 (426:4:0) -> 258:4:0
// Mapping#23 (409:22:0) -> 241:22:0
// VariableDeclaration#24 (409:24:0) -> 241:24:0
// StructDefinition#25 (288:148:0) -> 120:148:0
// StructuredDocumentation#26 (438:65:0) -> 270:64:0
// ElementaryTypeName#27 (569:3:0) -> 401:3:0
// VariableDeclaration#28 (569:8:0) -> 401:8:0
// ElementaryTypeName#29 (579:4:0) -> 411:4:0
// VariableDeclaration#30 (579:8:0) -> 411:8:0
// ParameterList#31 (568:20:0) -> 400:20:0
// ElementaryTypeName#32 (605:3:0) -> 437:3:0
// VariableDeclaration#33 (605:3:0) -> 437:3:0
// ParameterList#34 (604:5:0) -> 436:5:0
// Identifier#35 (628:4:0) -> 460:4:0
// Identifier#36 (636:3:0) -> 468:3:0
// BinaryOperation#37 (628:11:0) -> 460:11:0
// TupleExpression#38 (627:13:0) -> 459:13:0
// Return#39 (620:20:0) -> 452:20:0
// Block#40 (610:37:0) -> 442:37:0
// FunctionDefinition#41 (531:116:0) -> 363:116:0
// ContractDefinition#42 (503:146:0) -> 335:146:0
// StructuredDocumentation#43 (651:74:0) -> 483:73:0
// ElementaryTypeName#44 (774:6:0) -> 606:6:0
// VariableDeclaration#45 (774:17:0) -> 606:17:0
// ParameterList#46 (773:19:0) -> 605:19:0
// ElementaryTypeName#47 (811:5:0) -> 643:5:0
// VariableDeclaration#48 (811:12:0) -> 643:12:0
// ParameterList#49 (810:14:0) -> 642:14:0
// FunctionDefinition#50 (757:68:0) -> 589:68:0
// ContractDefinition#51 (725:102:0) -> 557:102:0
// ElementaryTypeName#52 (868:3:0) -> 700:3:0
// VariableDeclaration#53 (868:17:0) -> 700:17:0
// StructuredDocumentation#54 (892:36:0) -> 724:35:0
// ElementaryTypeName#55 (954:3:0) -> 785:3:0
// VariableDeclaration#56 (954:5:0) -> 785:5:0
// ParameterList#57 (953:7:0) -> 784:7:0
// ModifierDefinition#58 (933:36:0) -> 764:36:0
// ElementaryTypeName#59 (987:3:0) -> 818:3:0
// VariableDeclaration#60 (987:5:0) -> 818:5:0
// ParameterList#61 (986:7:0) -> 817:7:0
// Identifier#63 (1011:4:0) -> 842:4:0
// Identifier#64 (1018:1:0) -> 849:1:0
// Assignment#65 (1011:8:0) -> 842:8:0
// ExpressionStatement#66 (1011:8:0) -> 842:8:0
// Block#67 (1001:25:0) -> 832:25:0
// FunctionDefinition#68 (975:51:0) -> 806:51:0
// ElementaryTypeName#69 (1054:7:0) -> 885:7:0
// VariableDeclaration#70 (1054:9:0) -> 885:9:0
// ParameterList#71 (1053:11:0) -> 884:11:0
// ElementaryTypeName#72 (1091:15:0) -> 922:15:0
// VariableDeclaration#73 (1091:15:0) -> 922:15:0
// ParameterList#74 (1090:17:0) -> 921:17:0
// FunctionDefinition#75 (1032:76:0) -> 863:76:0
// ContractDefinition#76 (829:281:0) -> 661:280:0
// StructuredDocumentation#77 (1112:36:0) -> 943:36:0
// ContractDefinition#78 (1148:17:0) -> 980:17:0
// ParameterList#79 (1206:2:0) -> 1038:2:0
// Block#81 (1224:2:0) -> 1056:2:0
// FunctionDefinition#82 (1195:31:0) -> 1027:31:0
// ContractDefinition#83 (1167:61:0) -> 999:61:0
// UserDefinedTypeName#84 (1253:14:0) -> 1085:14:0
// Literal#85 (1268:1:0) -> 1100:1:0
// InheritanceSpecifier#86 (1253:17:0) -> 1085:17:0
// StructuredDocumentation#87 (1277:38:0) -> 1109:38:0
// ElementaryTypeName#88 (1332:7:0) -> 1164:7:0
// VariableDeclaration#89 (1332:14:0) -> 1164:14:0
// ElementaryTypeName#90 (1348:6:0) -> 1180:6:0
// VariableDeclaration#91 (1348:14:0) -> 1180:14:0
// ParameterList#92 (1331:32:0) -> 1163:32:0
// EventDefinition#93 (1320:44:0) -> 1152:44:0
// ElementaryTypeName#94 (1370:4:0) -> 1202:4:0
// Literal#95 (1404:1:0) -> 1236:1:0
// VariableDeclaration#96 (1370:35:0) -> 1202:35:0
// ElementaryTypeName#97 (1411:4:0) -> 1243:4:0
// Literal#98 (1451:1:0) -> 1283:1:0
// VariableDeclaration#99 (1411:41:0) -> 1243:41:0
// ElementaryTypeName#100 (1458:4:0) -> 1290:4:0
// VariableDeclaration#101 (1458:35:0) -> 1290:35:0
// ElementaryTypeName#102 (1499:4:0) -> 1331:4:0
// ArrayTypeName#103 (1499:6:0) -> 1331:6:0
// VariableDeclaration#104 (1499:20:0) -> 1331:20:0
// StructuredDocumentation#105 (1526:47:0) -> 1358:46:0
// ElementaryTypeName#106 (1599:3:0) -> 1430:3:0
// VariableDeclaration#107 (1599:5:0) -> 1430:5:0
// ParameterList#108 (1598:7:0) -> 1429:7:0
// OverrideSpecifier#109 (1606:8:0) -> 1437:8:0
// PlaceholderStatement#110 (1625:1:0) -> 1456:1:0
// Identifier#111 (1636:4:0) -> 1467:4:0
// Identifier#112 (1644:1:0) -> 1475:1:0
// Assignment#113 (1636:9:0) -> 1467:9:0
// ExpressionStatement#114 (1636:9:0) -> 1467:9:0
// Block#115 (1615:37:0) -> 1446:37:0
// ModifierDefinition#116 (1578:74:0) -> 1409:74:0
// StructuredDocumentation#117 (1658:89:0) -> 1489:89:0
// ParameterList#118 (1783:2:0) -> 1614:2:0
// Identifier#119 (1796:7:0) -> 1627:7:0
// Identifier#120 (1804:4:0) -> 1635:4:0
// Literal#121 (1811:1:0) -> 1642:1:0
// BinaryOperation#122 (1804:8:0) -> 1635:8:0
// Literal#123 (1814:9:0) -> 1645:9:0
// FunctionCall#124 (1796:28:0) -> 1627:28:0
// ExpressionStatement#125 (1796:28:0) -> 1627:28:0
// PlaceholderStatement#126 (1834:1:0) -> 1665:1:0
// Block#127 (1786:56:0) -> 1617:56:0
// ModifierDefinition#128 (1752:90:0) -> 1583:90:0
// ElementaryTypeName#129 (1871:6:0) -> 1702:6:0
// VariableDeclaration#130 (1871:21:0) -> 1702:21:0
// ParameterList#131 (1870:23:0) -> 1701:23:0
// PlaceholderStatement#132 (1904:1:0) -> 1735:1:0
// Identifier#133 (1920:5:0) -> 1751:5:0
// ElementaryTypeName#134 (1926:7:0) -> 1757:7:0
// ElementaryTypeNameExpression#135 (1926:7:0) -> 1757:7:0
// Identifier#136 (1934:4:0) -> 1765:4:0
// FunctionCall#137 (1926:13:0) -> 1757:13:0
// Identifier#138 (1941:7:0) -> 1772:7:0
// FunctionCall#139 (1920:29:0) -> 1751:29:0
// EmitStatement#140 (1915:34:0) -> 1746:34:0
// Block#141 (1894:62:0) -> 1725:62:0
// ModifierDefinition#142 (1848:108:0) -> 1679:108:0
// ElementaryTypeName#143 (1974:4:0) -> 1805:4:0
// VariableDeclaration#144 (1974:6:0) -> 1805:6:0
// ParameterList#145 (1973:8:0) -> 1804:8:0
// Identifier#147 (1999:13:0) -> 1830:13:0
// Identifier#148 (2015:1:0) -> 1846:1:0
// Assignment#149 (1999:17:0) -> 1830:17:0
// ExpressionStatement#150 (1999:17:0) -> 1830:17:0
// Block#151 (1989:34:0) -> 1820:34:0
// FunctionDefinition#152 (1962:61:0) -> 1793:61:0
// ElementaryTypeName#153 (2051:7:0) -> 1882:7:0
// VariableDeclaration#154 (2051:9:0) -> 1882:9:0
// ParameterList#155 (2050:11:0) -> 1881:11:0
// OverrideSpecifier#156 (2062:8:0) -> 1893:8:0
// ElementaryTypeName#157 (2089:15:0) -> 1920:15:0
// VariableDeclaration#158 (2089:15:0) -> 1920:15:0
// ParameterList#159 (2088:17:0) -> 1919:17:0
// ElementaryTypeName#160 (2123:8:0) -> 1954:7:0
// ElementaryTypeNameExpression#161 (2123:8:0) -> 1954:7:0
// Identifier#162 (2131:1:0) -> 1962:1:0
// FunctionCall#163 (2123:10:0) -> 1954:10:0
// Return#164 (2116:17:0) -> 1947:17:0
// Block#165 (2106:34:0) -> 1937:34:0
// FunctionDefinition#166 (2029:111:0) -> 1860:111:0
// ParameterList#167 (2171:2:0) -> 2002:2:0
// Block#169 (2188:2:0) -> 2019:2:0
// FunctionDefinition#170 (2146:44:0) -> 1977:44:0
// ParameterList#171 (2215:2:0) -> 2046:2:0
// Identifier#173 (2235:6:0) -> 2066:6:0
// Identifier#174 (2242:4:0) -> 2073:4:0
// ElementaryTypeName#175 (2247:4:0) -> 2078:4:0
// ElementaryTypeNameExpression#176 (2247:4:0) -> 2078:4:0
// FunctionCall#177 (2242:10:0) -> 2073:10:0
// MemberAccess#178 (2242:14:0) -> 2073:14:0
// Literal#179 (2260:1:0) -> 2091:1:0
// BinaryOperation#180 (2242:19:0) -> 2073:19:0
// FunctionCall#181 (2235:27:0) -> 2066:27:0
// ExpressionStatement#182 (2235:27:0) -> 2066:27:0
// Identifier#183 (2272:6:0) -> 2103:6:0
// Identifier#184 (2279:4:0) -> 2110:4:0
// ElementaryTypeName#185 (2284:4:0) -> 2115:4:0
// ElementaryTypeNameExpression#186 (2284:4:0) -> 2115:4:0
// FunctionCall#187 (2279:10:0) -> 2110:10:0
// MemberAccess#188 (2279:14:0) -> 2110:14:0
// Literal#189 (2297:78:0) -> 2128:78:0
// BinaryOperation#190 (2279:96:0) -> 2110:96:0
// FunctionCall#191 (2272:104:0) -> 2103:104:0
// ExpressionStatement#192 (2272:104:0) -> 2103:104:0
// Identifier#193 (2386:6:0) -> 2217:6:0
// Identifier#194 (2393:4:0) -> 2224:4:0
// ElementaryTypeName#195 (2398:6:0) -> 2229:6:0
// ElementaryTypeNameExpression#196 (2398:6:0) -> 2229:6:0
// FunctionCall#197 (2393:12:0) -> 2224:12:0
// MemberAccess#198 (2393:16:0) -> 2224:16:0
// Literal#199 (2415:77:0) -> 2246:77:0
// UnaryOperation#200 (2414:78:0) -> 2245:78:0
// TupleExpression#201 (2413:80:0) -> 2244:80:0
// BinaryOperation#202 (2393:100:0) -> 2224:100:0
// FunctionCall#203 (2386:108:0) -> 2217:108:0
// ExpressionStatement#204 (2386:108:0) -> 2217:108:0
// Identifier#205 (2504:6:0) -> 2335:6:0
// Identifier#206 (2511:4:0) -> 2342:4:0
// ElementaryTypeName#207 (2516:6:0) -> 2347:6:0
// ElementaryTypeNameExpression#208 (2516:6:0) -> 2347:6:0
// FunctionCall#209 (2511:12:0) -> 2342:12:0
// MemberAccess#210 (2511:16:0) -> 2342:16:0
// Literal#211 (2531:77:0) -> 2362:77:0
// BinaryOperation#212 (2511:97:0) -> 2342:97:0
// FunctionCall#213 (2504:105:0) -> 2335:105:0
// ExpressionStatement#214 (2504:105:0) -> 2335:105:0
// Block#215 (2225:391:0) -> 2056:391:0
// FunctionDefinition#216 (2196:420:0) -> 2027:420:0
// StructuredDocumentation#217 (2622:26:0) -> 2453:26:0
// ParameterList#218 (2677:2:0) -> 2508:2:0
// ElementaryTypeName#219 (2701:6:0) -> 2532:6:0
// VariableDeclaration#220 (2701:6:0) -> 2532:6:0
// ParameterList#221 (2700:8:0) -> 2531:8:0
// Identifier#222 (2726:4:0) -> 2557:4:0
// Identifier#223 (2731:15:0) -> 2562:15:0
// FunctionCall#224 (2726:21:0) -> 2557:21:0
// MemberAccess#225 (2726:33:0) -> 2557:33:0
// Return#226 (2719:40:0) -> 2550:40:0
// Block#227 (2709:57:0) -> 2540:57:0
// FunctionDefinition#228 (2653:113:0) -> 2484:113:0
// StructuredDocumentation#229 (2772:31:0) -> 2603:31:0
// ParameterList#230 (2827:2:0) -> 2658:2:0
// ElementaryTypeName#232 (2853:4:0) -> 2684:4:0
// VariableDeclaration#233 (2853:6:0) -> 2684:6:0
// ElementaryTypeName#234 (2861:4:0) -> 2692:4:0
// VariableDeclaration#235 (2861:6:0) -> 2692:6:0
// Identifier#236 (2871:3:0) -> 2702:3:0
// MemberAccess#237 (2871:10:0) -> 2702:10:0
// Identifier#238 (2882:3:0) -> 2713:3:0
// MemberAccess#239 (2882:8:0) -> 2713:8:0
// Literal#240 (2891:1:0) -> 2722:1:0
// Literal#241 (2893:1:0) -> 2724:1:0
// IndexRangeAccess#242 (2882:13:0) -> 2713:13:0
// ElementaryTypeName#243 (2898:4:0) -> 2729:4:0
// ElementaryTypeNameExpression#244 (2898:4:0) -> 2729:4:0
// ElementaryTypeName#245 (2904:4:0) -> 2735:4:0
// ElementaryTypeNameExpression#246 (2904:4:0) -> 2735:4:0
// TupleExpression#247 (2897:12:0) -> 2728:12:0
// FunctionCall#248 (2871:39:0) -> 2702:39:0
// VariableDeclarationStatement#249 (2852:58:0) -> 2683:58:0
// ElementaryTypeName#250 (2921:4:0) -> 2752:4:0
// VariableDeclaration#251 (2921:6:0) -> 2752:6:0
// ElementaryTypeName#252 (2929:4:0) -> 2760:4:0
// VariableDeclaration#253 (2929:6:0) -> 2760:6:0
// Identifier#254 (2939:3:0) -> 2770:3:0
// MemberAccess#255 (2939:10:0) -> 2770:10:0
// Identifier#256 (2950:3:0) -> 2781:3:0
// MemberAccess#257 (2950:8:0) -> 2781:8:0
// Literal#258 (2960:1:0) -> 2791:1:0
// IndexRangeAccess#259 (2950:12:0) -> 2781:12:0
// ElementaryTypeName#260 (2965:4:0) -> 2796:4:0
// ElementaryTypeNameExpression#261 (2965:4:0) -> 2796:4:0
// ElementaryTypeName#262 (2971:4:0) -> 2802:4:0
// ElementaryTypeNameExpression#263 (2971:4:0) -> 2802:4:0
// TupleExpression#264 (2964:12:0) -> 2795:12:0
// FunctionCall#265 (2939:38:0) -> 2770:38:0
// VariableDeclarationStatement#266 (2920:57:0) -> 2751:57:0
// ElementaryTypeName#267 (2988:4:0) -> 2819:4:0
// VariableDeclaration#268 (2988:6:0) -> 2819:6:0
// ElementaryTypeName#269 (2996:4:0) -> 2827:4:0
// VariableDeclaration#270 (2996:6:0) -> 2827:6:0
// Identifier#271 (3006:3:0) -> 2837:3:0
// MemberAccess#272 (3006:10:0) -> 2837:10:0
// Identifier#273 (3017:3:0) -> 2848:3:0
// MemberAccess#274 (3017:8:0) -> 2848:8:0
// Literal#275 (3026:1:0) -> 2857:1:0
// IndexRangeAccess#276 (3017:12:0) -> 2848:12:0
// ElementaryTypeName#277 (3032:4:0) -> 2863:4:0
// ElementaryTypeNameExpression#278 (3032:4:0) -> 2863:4:0
// ElementaryTypeName#279 (3038:4:0) -> 2869:4:0
// ElementaryTypeNameExpression#280 (3038:4:0) -> 2869:4:0
// TupleExpression#281 (3031:12:0) -> 2862:12:0
// FunctionCall#282 (3006:38:0) -> 2837:38:0
// VariableDeclarationStatement#283 (2987:57:0) -> 2818:57:0
// ElementaryTypeName#284 (3055:4:0) -> 2886:4:0
// VariableDeclaration#285 (3055:6:0) -> 2886:6:0
// ElementaryTypeName#286 (3063:4:0) -> 2894:4:0
// VariableDeclaration#287 (3063:6:0) -> 2894:6:0
// Identifier#288 (3073:3:0) -> 2904:3:0
// MemberAccess#289 (3073:10:0) -> 2904:10:0
// Identifier#290 (3084:3:0) -> 2915:3:0
// MemberAccess#291 (3084:8:0) -> 2915:8:0
// IndexRangeAccess#292 (3084:11:0) -> 2915:11:0
// ElementaryTypeName#293 (3098:4:0) -> 2929:4:0
// ElementaryTypeNameExpression#294 (3098:4:0) -> 2929:4:0
// ElementaryTypeName#295 (3104:4:0) -> 2935:4:0
// ElementaryTypeNameExpression#296 (3104:4:0) -> 2935:4:0
// TupleExpression#297 (3097:12:0) -> 2928:12:0
// FunctionCall#298 (3073:37:0) -> 2904:37:0
// VariableDeclarationStatement#299 (3054:56:0) -> 2885:56:0
// ElementaryTypeName#300 (3121:4:0) -> 2952:4:0
// VariableDeclaration#301 (3121:6:0) -> 2952:6:0
// ElementaryTypeName#302 (3129:4:0) -> 2960:4:0
// VariableDeclaration#303 (3129:6:0) -> 2960:6:0
// Identifier#304 (3139:3:0) -> 2970:3:0
// MemberAccess#305 (3139:10:0) -> 2970:10:0
// Identifier#306 (3150:3:0) -> 2981:3:0
// MemberAccess#307 (3150:8:0) -> 2981:8:0
// ElementaryTypeName#308 (3161:4:0) -> 2992:4:0
// ElementaryTypeNameExpression#309 (3161:4:0) -> 2992:4:0
// ElementaryTypeName#310 (3167:4:0) -> 2998:4:0
// ElementaryTypeNameExpression#311 (3167:4:0) -> 2998:4:0
// TupleExpression#312 (3160:12:0) -> 2991:12:0
// FunctionCall#313 (3139:34:0) -> 2970:34:0
// VariableDeclarationStatement#314 (3120:53:0) -> 2951:53:0
// Block#315 (2842:338:0) -> 2673:338:0
// FunctionDefinition#316 (2808:372:0) -> 2639:372:0
// ParameterList#317 (3207:2:0) -> 3038:2:0
// Identifier#318 (3217:13:0) -> 3048:13:0
// Literal#319 (3231:25:0) -> 3062:25:0
// ModifierInvocation#320 (3217:40:0) -> 3048:40:0
// UserDefinedTypeName#322 (3276:5:0) -> 3107:5:0
// NewExpression#323 (3272:9:0) -> 3103:9:0
// FunctionCall#324 (3272:11:0) -> 3103:11:0
// ElementaryTypeName#325 (3298:3:0) -> 3129:3:0
// VariableDeclaration#326 (3298:5:0) -> 3129:5:0
// Literal#327 (3306:1:0) -> 3137:1:0
// VariableDeclarationStatement#328 (3298:9:0) -> 3129:9:0
// Block#329 (3284:34:0) -> 3115:34:0
// TryCatchClause#330 (3284:34:0) -> 3115:34:0
// ElementaryTypeName#331 (3339:3:0) -> 3170:3:0
// VariableDeclaration#332 (3339:5:0) -> 3170:5:0
// Literal#333 (3347:1:0) -> 3178:1:0
// VariableDeclarationStatement#334 (3339:9:0) -> 3170:9:0
// Block#335 (3325:34:0) -> 3156:34:0
// TryCatchClause#336 (3319:40:0) -> 3150:40:0
// TryStatement#337 (3268:91:0) -> 3099:91:0
// UserDefinedTypeName#338 (3376:12:0) -> 3207:12:0
// NewExpression#339 (3372:16:0) -> 3203:16:0
// Literal#340 (3395:3:0) -> 3226:3:0
// Literal#341 (3407:7:0) -> 3238:7:0
// FunctionCallOptions#342 (3372:43:0) -> 3203:43:0
// FunctionCall#343 (3372:45:0) -> 3203:45:0
// UserDefinedTypeName#344 (3427:12:0) -> 3258:12:0
// VariableDeclaration#345 (3427:14:0) -> 3258:14:0
// ParameterList#346 (3426:16:0) -> 3257:16:0
// ElementaryTypeName#347 (3457:3:0) -> 3288:3:0
// VariableDeclaration#348 (3457:5:0) -> 3288:5:0
// Literal#349 (3465:1:0) -> 3296:1:0
// VariableDeclarationStatement#350 (3457:9:0) -> 3288:9:0
// Block#351 (3443:34:0) -> 3274:34:0
// TryCatchClause#352 (3418:59:0) -> 3249:59:0
// ElementaryTypeName#353 (3490:6:0) -> 3321:6:0
// VariableDeclaration#354 (3490:20:0) -> 3321:20:0
// ParameterList#355 (3489:22:0) -> 3320:22:0
// Block#356 (3512:2:0) -> 3343:2:0
// TryCatchClause#357 (3478:36:0) -> 3309:36:0
// ElementaryTypeName#358 (3522:5:0) -> 3353:5:0
// VariableDeclaration#359 (3522:25:0) -> 3353:25:0
// ParameterList#360 (3521:27:0) -> 3352:27:0
// Block#361 (3549:2:0) -> 3380:2:0
// TryCatchClause#362 (3515:36:0) -> 3346:36:0
// TryStatement#363 (3368:183:0) -> 3199:183:0
// Block#364 (3258:299:0) -> 3089:299:0
// FunctionDefinition#365 (3186:371:0) -> 3017:371:0
// ParameterList#366 (3580:2:0) -> 3411:2:0
// Identifier#368 (3600:6:0) -> 3431:6:0
// Literal#369 (3607:6:0) -> 3438:6:0
// Literal#370 (3617:14:0) -> 3448:14:0
// BinaryOperation#371 (3607:24:0) -> 3438:24:0
// FunctionCall#372 (3600:32:0) -> 3431:32:0
// ExpressionStatement#373 (3600:32:0) -> 3431:32:0
// Identifier#374 (3642:6:0) -> 3473:6:0
// Literal#375 (3649:6:0) -> 3480:6:0
// Literal#376 (3659:11:0) -> 3490:11:0
// BinaryOperation#377 (3649:21:0) -> 3480:21:0
// FunctionCall#378 (3642:29:0) -> 3473:29:0
// ExpressionStatement#379 (3642:29:0) -> 3473:29:0
// Block#380 (3590:88:0) -> 3421:88:0
// FunctionDefinition#381 (3563:115:0) -> 3394:115:0
// ParameterList#382 (3711:2:0) -> 3542:2:0
// Identifier#383 (3723:22:0) -> 3554:22:0
// ModifierInvocation#384 (3723:24:0) -> 3554:24:0
// ElementaryTypeName#385 (3757:4:0) -> 3588:4:0
// VariableDeclaration#386 (3757:4:0) -> 3588:4:0
// ParameterList#387 (3756:6:0) -> 3587:6:0
// ElementaryTypeName#388 (3782:7:0) -> 3613:7:0
// VariableDeclaration#389 (3782:7:0) -> 3613:7:0
// ParameterList#390 (3781:9:0) -> 3612:9:0
// ElementaryTypeName#391 (3809:15:0) -> 3640:15:0
// VariableDeclaration#392 (3809:15:0) -> 3640:15:0
// ParameterList#393 (3808:17:0) -> 3639:17:0
// FunctionTypeName#394 (3773:62:0) -> 3604:52:0
// VariableDeclaration#395 (3773:62:0) -> 3604:62:0
// Identifier#396 (3838:10:0) -> 3669:10:0
// MemberAccess#397 (3838:23:0) -> 3669:23:0
// VariableDeclarationStatement#398 (3773:88:0) -> 3604:88:0
// ParameterList#399 (3879:2:0) -> 3710:2:0
// FunctionTypeName#401 (3871:28:0) -> 3702:24:0
// VariableDeclaration#402 (3871:28:0) -> 3702:28:0
// Identifier#403 (3902:10:0) -> 3733:10:0
// MemberAccess#404 (3902:27:0) -> 3733:27:0
// VariableDeclarationStatement#405 (3871:58:0) -> 3702:58:0
// ElementaryTypeName#408 (3939:4:0) -> 3770:4:0
// ArrayTypeName#409 (3939:6:0) -> 3770:6:0
// VariableDeclaration#410 (3939:18:0) -> 3770:18:0
// ElementaryTypeName#411 (3964:4:0) -> 3795:4:0
// ArrayTypeName#412 (3964:6:0) -> 3795:6:0
// NewExpression#413 (3960:10:0) -> 3791:10:0
// Literal#414 (3971:1:0) -> 3802:1:0
// FunctionCall#415 (3960:13:0) -> 3791:13:0
// VariableDeclarationStatement#416 (3939:34:0) -> 3770:34:0
// Identifier#417 (3983:4:0) -> 3814:4:0
// Literal#418 (3988:1:0) -> 3819:1:0
// IndexAccess#419 (3983:7:0) -> 3814:7:0
// Literal#420 (3993:1:0) -> 3824:1:0
// Assignment#421 (3983:11:0) -> 3814:11:0
// ExpressionStatement#422 (3983:11:0) -> 3814:11:0
// Identifier#423 (4004:4:0) -> 3835:4:0
// Literal#424 (4009:1:0) -> 3840:1:0
// IndexAccess#425 (4004:7:0) -> 3835:7:0
// Literal#426 (4014:1:0) -> 3845:1:0
// Assignment#427 (4004:11:0) -> 3835:11:0
// ExpressionStatement#428 (4004:11:0) -> 3835:11:0
// Identifier#429 (4025:4:0) -> 3856:4:0
// Literal#430 (4030:1:0) -> 3861:1:0
// IndexAccess#431 (4025:7:0) -> 3856:7:0
// Literal#432 (4035:1:0) -> 3866:1:0
// Assignment#433 (4025:11:0) -> 3856:11:0
// ExpressionStatement#434 (4025:11:0) -> 3856:11:0
// UserDefinedTypeName#435 (4046:12:0) -> 3877:12:0
// VariableDeclaration#436 (4046:21:0) -> 3877:21:0
// Identifier#437 (4070:12:0) -> 3901:12:0
// Literal#438 (4083:1:0) -> 3914:1:0
// Identifier#439 (4086:4:0) -> 3917:4:0
// FunctionCall#440 (4070:21:0) -> 3901:21:0
// VariableDeclarationStatement#441 (4046:45:0) -> 3877:45:0
// ElementaryTypeName#444 (4101:4:0) -> 3932:4:0
// ArrayTypeName#445 (4101:6:0) -> 3932:6:0
// VariableDeclaration#446 (4101:15:0) -> 3932:15:0
// Identifier#447 (4119:1:0) -> 3950:1:0
// MemberAccess#448 (4119:3:0) -> 3950:3:0
// VariableDeclarationStatement#449 (4101:21:0) -> 3932:21:0
// Identifier#450 (4139:1:0) -> 3970:1:0
// UnaryOperation#451 (4132:8:0) -> 3963:8:0
// ExpressionStatement#452 (4132:8:0) -> 3963:8:0
// ElementaryTypeName#453 (4150:4:0) -> 3981:4:0
// VariableDeclaration#454 (4150:6:0) -> 3981:6:0
// Identifier#455 (4159:1:0) -> 3990:1:0
// Literal#456 (4161:1:0) -> 3992:1:0
// IndexAccess#457 (4159:4:0) -> 3990:4:0
// VariableDeclarationStatement#458 (4150:13:0) -> 3981:13:0
// Identifier#459 (4180:1:0) -> 4011:1:0
// UnaryOperation#460 (4173:8:0) -> 4004:8:0
// ExpressionStatement#461 (4173:8:0) -> 4004:8:0
// Identifier#462 (4198:1:0) -> 4029:1:0
// Return#463 (4191:8:0) -> 4022:8:0
// Block#464 (3763:443:0) -> 3594:443:0
// FunctionDefinition#465 (3684:522:0) -> 3515:522:0
// ParameterList#466 (4234:2:0) -> 4065:2:0
// Identifier#468 (4254:4:0) -> 4085:4:0
// MemberAccess#471 (4254:15:0) -> 4085:15:0
// MemberAccess#472 (4254:24:0) -> 4085:24:0
// ExpressionStatement#473 (4254:24:0) -> 4085:24:0
// Identifier#474 (4288:13:0) -> 4119:13:0
// MemberAccess#477 (4288:42:0) -> 4119:42:0
// MemberAccess#478 (4288:51:0) -> 4119:51:0
// ExpressionStatement#479 (4288:51:0) -> 4119:51:0
// Identifier#480 (4349:15:0) -> 4180:15:0
// MemberAccess#483 (4349:23:0) -> 4180:23:0
// MemberAccess#484 (4349:32:0) -> 4180:32:0
// ExpressionStatement#485 (4349:32:0) -> 4180:32:0
// Block#486 (4244:144:0) -> 4075:144:0
// FunctionDefinition#487 (4212:176:0) -> 4043:176:0
// ElementaryTypeName#488 (4425:4:0) -> 4256:4:0
// ArrayTypeName#489 (4425:6:0) -> 4256:6:0
// VariableDeclaration#490 (4425:15:0) -> 4256:15:0
// ParameterList#491 (4424:17:0) -> 4255:17:0
// ElementaryTypeName#492 (4460:4:0) -> 4291:4:0
// ArrayTypeName#493 (4460:6:0) -> 4291:6:0
// VariableDeclaration#494 (4460:13:0) -> 4291:13:0
// ParameterList#495 (4459:15:0) -> 4290:15:0
// Identifier#496 (4485:4:0) -> 4316:4:0
// Identifier#497 (4492:1:0) -> 4323:1:0
// Assignment#498 (4485:8:0) -> 4316:8:0
// ExpressionStatement#499 (4485:8:0) -> 4316:8:0
// ElementaryTypeName#502 (4503:4:0) -> 4334:4:0
// ArrayTypeName#503 (4503:6:0) -> 4334:6:0
// VariableDeclaration#504 (4503:16:0) -> 4334:16:0
// VariableDeclarationStatement#505 (4503:16:0) -> 4334:16:0
// Identifier#506 (4529:1:0) -> 4360:1:0
// Identifier#507 (4533:4:0) -> 4364:4:0
// Assignment#508 (4529:8:0) -> 4360:8:0
// ExpressionStatement#509 (4529:8:0) -> 4360:8:0
// Identifier#510 (4554:1:0) -> 4385:1:0
// Return#511 (4547:8:0) -> 4378:8:0
// Block#512 (4475:87:0) -> 4306:87:0
// FunctionDefinition#513 (4394:168:0) -> 4225:168:0
// ParameterList#514 (4575:2:0) -> 4406:2:0
// Block#516 (4595:2:0) -> 4426:2:0
// FunctionDefinition#517 (4568:29:0) -> 4399:29:0
// ParameterList#518 (4611:2:0) -> 4442:2:0
// Block#520 (4623:2:0) -> 4454:2:0
// FunctionDefinition#521 (4603:22:0) -> 4434:22:0
// ContractDefinition#522 (1230:3397:0) -> 1062:3396:0
// StructuredDocumentation#523 (4658:29:0) -> 4489:29:0
// ElementaryTypeName#524 (4692:4:0) -> 4523:4:0
// ArrayTypeName#525 (4692:6:0) -> 4523:6:0
// VariableDeclaration#526 (4692:22:0) -> 4523:22:0
// ElementaryTypeName#527 (4740:4:0) -> 4571:4:0
// ArrayTypeName#528 (4740:6:0) -> 4571:6:0
// ArrayTypeName#529 (4740:8:0) -> 4571:8:0
// VariableDeclaration#530 (4740:22:0) -> 4571:22:0
// ElementaryTypeName#531 (4764:4:0) -> 4595:4:0
// VariableDeclaration#532 (4764:10:0) -> 4595:10:0
// ParameterList#533 (4739:36:0) -> 4570:36:0
// ElementaryTypeName#534 (4798:4:0) -> 4629:4:0
// ArrayTypeName#535 (4798:6:0) -> 4629:6:0
// VariableDeclaration#536 (4798:15:0) -> 4629:15:0
// ParameterList#537 (4797:17:0) -> 4628:17:0
// Identifier#538 (4825:7:0) -> 4656:7:0
// Identifier#539 (4833:4:0) -> 4664:4:0
// MemberAccess#540 (4833:11:0) -> 4664:11:0
// Identifier#541 (4847:5:0) -> 4678:5:0
// BinaryOperation#542 (4833:19:0) -> 4664:19:0
// Literal#543 (4854:29:0) -> 4685:29:0
// FunctionCall#544 (4825:59:0) -> 4656:59:0
// ExpressionStatement#545 (4825:59:0) -> 4656:59:0
// ElementaryTypeName#548 (4932:4:0) -> 4725:4:0
// ArrayTypeName#549 (4932:6:0) -> 4725:6:0
// VariableDeclaration#550 (4932:19:0) -> 4725:19:0
// Identifier#551 (4954:4:0) -> 4747:4:0
// Identifier#552 (4959:5:0) -> 4752:5:0
// IndexAccess#553 (4954:11:0) -> 4747:11:0
// VariableDeclarationStatement#554 (4932:33:0) -> 4725:33:0
// Identifier#555 (4982:3:0) -> 4775:3:0
// Return#556 (4975:10:0) -> 4768:10:0
// Block#557 (4815:177:0) -> 4646:139:0
// FunctionDefinition#558 (4721:271:0) -> 4552:233:0
// ElementaryTypeName#559 (5017:4:0) -> 4810:4:0
// ArrayTypeName#560 (5017:6:0) -> 4810:6:0
// ArrayTypeName#561 (5017:8:0) -> 4810:8:0
// VariableDeclaration#562 (5017:22:0) -> 4810:22:0
// ParameterList#563 (5016:24:0) -> 4809:24:0
// ElementaryTypeName#567 (5058:4:0) -> 4851:4:0
// ArrayTypeName#568 (5058:6:0) -> 4851:6:0
// VariableDeclaration#569 (5058:19:0) -> 4851:19:0
// Identifier#570 (5080:9:0) -> 4873:9:0
// Identifier#571 (5090:4:0) -> 4883:4:0
// Literal#572 (5096:1:0) -> 4889:1:0
// FunctionCall#573 (5080:18:0) -> 4873:18:0
// VariableDeclarationStatement#574 (5058:40:0) -> 4851:40:0
// Identifier#575 (5108:11:0) -> 4901:11:0
// Identifier#576 (5120:3:0) -> 4913:3:0
// FunctionCall#577 (5108:16:0) -> 4901:16:0
// ExpressionStatement#578 (5108:16:0) -> 4901:16:0
// ElementaryTypeName#579 (5139:4:0) -> 4932:4:0
// VariableDeclaration#580 (5139:6:0) -> 4932:6:0
// Literal#581 (5148:1:0) -> 4941:1:0
// VariableDeclarationStatement#582 (5139:10:0) -> 4932:10:0
// Identifier#583 (5151:1:0) -> 4944:1:0
// Identifier#584 (5155:3:0) -> 4948:3:0
// MemberAccess#585 (5155:10:0) -> 4948:10:0
// BinaryOperation#586 (5151:14:0) -> 4944:14:0
// Identifier#587 (5167:1:0) -> 4960:1:0
// UnaryOperation#588 (5167:3:0) -> 4960:3:0
// ExpressionStatement#589 (5167:3:0) -> 4960:3:0
// Identifier#590 (5186:6:0) -> 4979:6:0
// MemberAccess#592 (5186:11:0) -> 4979:11:0
// Identifier#593 (5198:3:0) -> 4991:3:0
// Identifier#594 (5202:1:0) -> 4995:1:0
// IndexAccess#595 (5198:6:0) -> 4991:6:0
// FunctionCall#596 (5186:19:0) -> 4979:19:0
// ExpressionStatement#597 (5186:19:0) -> 4979:19:0
// Block#598 (5172:44:0) -> 4965:44:0
// ForStatement#599 (5134:82:0) -> 4927:82:0
// Block#600 (5048:174:0) -> 4841:174:0
// FunctionDefinition#601 (4998:224:0) -> 4791:224:0
// ElementaryTypeName#602 (5249:4:0) -> 5042:4:0
// ArrayTypeName#603 (5249:6:0) -> 5042:6:0
// VariableDeclaration#604 (5249:25:0) -> 5042:25:0
// ParameterList#605 (5248:27:0) -> 5041:27:0
// ElementaryTypeName#607 (5305:4:0) -> 5098:4:0
// VariableDeclaration#608 (5305:6:0) -> 5098:6:0
// Literal#609 (5314:1:0) -> 5107:1:0
// VariableDeclarationStatement#610 (5305:10:0) -> 5098:10:0
// Identifier#611 (5317:1:0) -> 5110:1:0
// Identifier#612 (5321:9:0) -> 5114:9:0
// MemberAccess#613 (5321:16:0) -> 5114:16:0
// BinaryOperation#614 (5317:20:0) -> 5110:20:0
// Identifier#615 (5339:1:0) -> 5132:1:0
// UnaryOperation#616 (5339:3:0) -> 5132:3:0
// ExpressionStatement#617 (5339:3:0) -> 5132:3:0
// ElementaryTypeName#618 (5363:4:0) -> 5156:4:0
// VariableDeclaration#619 (5363:6:0) -> 5156:6:0
// Identifier#620 (5372:1:0) -> 5165:1:0
// Literal#621 (5376:1:0) -> 5169:1:0
// BinaryOperation#622 (5372:5:0) -> 5165:5:0
// VariableDeclarationStatement#623 (5363:14:0) -> 5156:14:0
// Identifier#624 (5379:1:0) -> 5172:1:0
// Identifier#625 (5383:9:0) -> 5176:9:0
// MemberAccess#626 (5383:16:0) -> 5176:16:0
// BinaryOperation#627 (5379:20:0) -> 5172:20:0
// Identifier#628 (5401:1:0) -> 5194:1:0
// UnaryOperation#629 (5401:3:0) -> 5194:3:0
// ExpressionStatement#630 (5401:3:0) -> 5194:3:0
// Identifier#631 (5424:7:0) -> 5217:7:0
// Identifier#632 (5432:9:0) -> 5225:9:0
// Identifier#633 (5442:1:0) -> 5235:1:0
// IndexAccess#634 (5432:12:0) -> 5225:12:0
// Identifier#635 (5448:9:0) -> 5241:9:0
// Identifier#636 (5458:1:0) -> 5251:1:0
// IndexAccess#637 (5448:12:0) -> 5241:12:0
// BinaryOperation#638 (5432:28:0) -> 5225:28:0
// FunctionCall#639 (5424:37:0) -> 5217:37:0
// ExpressionStatement#640 (5424:37:0) -> 5217:37:0
// Block#641 (5406:70:0) -> 5199:70:0
// ForStatement#642 (5358:118:0) -> 5151:118:0
// Block#643 (5344:142:0) -> 5137:142:0
// ForStatement#644 (5300:186:0) -> 5093:186:0
// Block#645 (5290:202:0) -> 5083:202:0
// FunctionDefinition#646 (5228:264:0) -> 5021:264:0
// ContractDefinition#647 (4629:865:0) -> 4460:827:0
// ParameterList#648 (5539:2:0) -> 5332:2:0
// ElementaryTypeName#649 (5565:15:0) -> 5358:15:0
// VariableDeclaration#650 (5565:15:0) -> 5358:15:0
// ParameterList#651 (5564:17:0) -> 5357:17:0
// FunctionDefinition#652 (5526:56:0) -> 5319:56:0
// ContractDefinition#653 (5496:88:0) -> 5289:88:0
// UserDefinedTypeName#654 (5616:13:0) -> 5409:13:0
// InheritanceSpecifier#655 (5616:13:0) -> 5409:13:0
// StructuredDocumentation#656 (5636:60:0) -> 5429:59:0
// ElementaryTypeName#657 (5701:15:0) -> 5493:15:0
// OverrideSpecifier#658 (5734:8:0) -> 5526:8:0
// ElementaryTypeName#659 (5750:7:0) -> 5542:7:0
// ElementaryTypeNameExpression#660 (5750:7:0) -> 5542:7:0
// Literal#661 (5758:3:0) -> 5550:3:0
// FunctionCall#662 (5750:12:0) -> 5542:12:0
// VariableDeclaration#663 (5701:61:0) -> 5493:61:0
// ContractDefinition#664 (5586:179:0) -> 5379:178:0
// SourceUnit#665 (168:5598:0) -> 0:5557:0
