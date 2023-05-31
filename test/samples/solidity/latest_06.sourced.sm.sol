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
// EnumValue#4 (280:1:0) -> 113:1:0
// EnumValue#5 (287:1:0) -> 120:1:0
// EnumValue#6 (294:1:0) -> 127:1:0
// EnumDefinition#7 (258:39:0) -> 91:39:0
// ElementaryTypeName#8 (325:3:0) -> 158:3:0
// VariableDeclaration#9 (325:5:0) -> 158:5:0
// ElementaryTypeName#10 (336:4:0) -> 169:4:0
// ArrayTypeName#11 (336:6:0) -> 169:6:0
// VariableDeclaration#12 (336:8:0) -> 169:8:0
// ElementaryTypeName#13 (358:7:0) -> 191:7:0
// ElementaryTypeName#14 (369:4:0) -> 202:4:0
// Mapping#15 (350:24:0) -> 183:24:0
// VariableDeclaration#16 (350:26:0) -> 183:26:0
// UserDefinedTypeName#17 (390:10:0) -> 223:10:0
// ElementaryTypeName#18 (404:7:0) -> 237:7:0
// Mapping#19 (382:30:0) -> 215:30:0
// VariableDeclaration#20 (382:32:0) -> 215:32:0
// UserDefinedTypeName#21 (428:5:0) -> 261:5:0
// ElementaryTypeName#22 (437:4:0) -> 270:4:0
// Mapping#23 (420:22:0) -> 253:22:0
// VariableDeclaration#24 (420:24:0) -> 253:24:0
// StructDefinition#25 (299:148:0) -> 132:148:0
// StructuredDocumentation#26 (449:65:0) -> 282:64:0
// ElementaryTypeName#27 (580:3:0) -> 413:3:0
// VariableDeclaration#28 (580:8:0) -> 413:8:0
// ElementaryTypeName#29 (590:4:0) -> 423:4:0
// VariableDeclaration#30 (590:8:0) -> 423:8:0
// ParameterList#31 (579:20:0) -> 412:20:0
// ElementaryTypeName#32 (616:3:0) -> 449:3:0
// VariableDeclaration#33 (616:3:0) -> 449:3:0
// ParameterList#34 (615:5:0) -> 448:5:0
// Identifier#35 (639:4:0) -> 472:4:0
// Identifier#36 (647:3:0) -> 480:3:0
// BinaryOperation#37 (639:11:0) -> 472:11:0
// TupleExpression#38 (638:13:0) -> 471:13:0
// Return#39 (631:20:0) -> 464:20:0
// Block#40 (621:37:0) -> 454:37:0
// FunctionDefinition#41 (542:116:0) -> 375:116:0
// ContractDefinition#42 (514:146:0) -> 347:146:0
// StructuredDocumentation#43 (662:74:0) -> 495:73:0
// ElementaryTypeName#44 (785:6:0) -> 618:6:0
// VariableDeclaration#45 (785:17:0) -> 618:17:0
// ParameterList#46 (784:19:0) -> 617:19:0
// ElementaryTypeName#47 (822:5:0) -> 655:5:0
// VariableDeclaration#48 (822:12:0) -> 655:12:0
// ParameterList#49 (821:14:0) -> 654:14:0
// FunctionDefinition#50 (768:68:0) -> 601:68:0
// ContractDefinition#51 (736:102:0) -> 569:102:0
// ElementaryTypeName#52 (879:3:0) -> 712:3:0
// VariableDeclaration#53 (879:17:0) -> 712:17:0
// StructuredDocumentation#54 (903:36:0) -> 736:35:0
// ElementaryTypeName#55 (965:3:0) -> 797:3:0
// VariableDeclaration#56 (965:5:0) -> 797:5:0
// ParameterList#57 (964:7:0) -> 796:7:0
// ModifierDefinition#58 (944:36:0) -> 776:36:0
// ElementaryTypeName#59 (998:3:0) -> 830:3:0
// VariableDeclaration#60 (998:5:0) -> 830:5:0
// ParameterList#61 (997:7:0) -> 829:7:0
// Identifier#63 (1022:4:0) -> 854:4:0
// Identifier#64 (1029:1:0) -> 861:1:0
// Assignment#65 (1022:8:0) -> 854:8:0
// ExpressionStatement#66 (1022:8:0) -> 854:8:0
// Block#67 (1012:25:0) -> 844:25:0
// FunctionDefinition#68 (986:51:0) -> 818:51:0
// ElementaryTypeName#69 (1065:7:0) -> 897:7:0
// VariableDeclaration#70 (1065:9:0) -> 897:9:0
// ParameterList#71 (1064:11:0) -> 896:11:0
// ElementaryTypeName#72 (1102:15:0) -> 934:15:0
// VariableDeclaration#73 (1102:15:0) -> 934:15:0
// ParameterList#74 (1101:17:0) -> 933:17:0
// FunctionDefinition#75 (1043:76:0) -> 875:76:0
// ContractDefinition#76 (840:281:0) -> 673:280:0
// StructuredDocumentation#77 (1123:36:0) -> 955:36:0
// ContractDefinition#78 (1159:17:0) -> 992:17:0
// ParameterList#79 (1217:2:0) -> 1050:2:0
// Block#81 (1235:2:0) -> 1068:2:0
// FunctionDefinition#82 (1206:31:0) -> 1039:31:0
// ContractDefinition#83 (1178:61:0) -> 1011:61:0
// UserDefinedTypeName#84 (1264:14:0) -> 1097:14:0
// Literal#85 (1279:1:0) -> 1112:1:0
// InheritanceSpecifier#86 (1264:17:0) -> 1097:17:0
// StructuredDocumentation#87 (1288:38:0) -> 1121:38:0
// ElementaryTypeName#88 (1343:7:0) -> 1176:7:0
// VariableDeclaration#89 (1343:14:0) -> 1176:14:0
// ElementaryTypeName#90 (1359:6:0) -> 1192:6:0
// VariableDeclaration#91 (1359:14:0) -> 1192:14:0
// ParameterList#92 (1342:32:0) -> 1175:32:0
// EventDefinition#93 (1331:44:0) -> 1164:44:0
// ElementaryTypeName#94 (1381:4:0) -> 1214:4:0
// Literal#95 (1415:1:0) -> 1248:1:0
// VariableDeclaration#96 (1381:35:0) -> 1214:35:0
// ElementaryTypeName#97 (1422:4:0) -> 1255:4:0
// Literal#98 (1462:1:0) -> 1295:1:0
// VariableDeclaration#99 (1422:41:0) -> 1255:41:0
// ElementaryTypeName#100 (1469:4:0) -> 1302:4:0
// VariableDeclaration#101 (1469:35:0) -> 1302:35:0
// ElementaryTypeName#102 (1510:4:0) -> 1343:4:0
// ArrayTypeName#103 (1510:6:0) -> 1343:6:0
// VariableDeclaration#104 (1510:20:0) -> 1343:20:0
// StructuredDocumentation#105 (1537:47:0) -> 1370:46:0
// ElementaryTypeName#106 (1610:3:0) -> 1442:3:0
// VariableDeclaration#107 (1610:5:0) -> 1442:5:0
// ParameterList#108 (1609:7:0) -> 1441:7:0
// OverrideSpecifier#109 (1617:8:0) -> 1449:8:0
// PlaceholderStatement#110 (1636:1:0) -> 1468:1:0
// Identifier#111 (1647:4:0) -> 1479:4:0
// Identifier#112 (1655:1:0) -> 1487:1:0
// Assignment#113 (1647:9:0) -> 1479:9:0
// ExpressionStatement#114 (1647:9:0) -> 1479:9:0
// Block#115 (1626:37:0) -> 1458:37:0
// ModifierDefinition#116 (1589:74:0) -> 1421:74:0
// StructuredDocumentation#117 (1669:89:0) -> 1501:89:0
// ParameterList#118 (1794:2:0) -> 1626:2:0
// Identifier#119 (1807:7:0) -> 1639:7:0
// Identifier#120 (1815:4:0) -> 1647:4:0
// Literal#121 (1822:1:0) -> 1654:1:0
// BinaryOperation#122 (1815:8:0) -> 1647:8:0
// Literal#123 (1825:9:0) -> 1657:9:0
// FunctionCall#124 (1807:28:0) -> 1639:28:0
// ExpressionStatement#125 (1807:28:0) -> 1639:28:0
// PlaceholderStatement#126 (1845:1:0) -> 1677:1:0
// Block#127 (1797:56:0) -> 1629:56:0
// ModifierDefinition#128 (1763:90:0) -> 1595:90:0
// ElementaryTypeName#129 (1882:6:0) -> 1714:6:0
// VariableDeclaration#130 (1882:21:0) -> 1714:21:0
// ParameterList#131 (1881:23:0) -> 1713:23:0
// PlaceholderStatement#132 (1915:1:0) -> 1747:1:0
// Identifier#133 (1931:5:0) -> 1763:5:0
// ElementaryTypeName#134 (1937:7:0) -> 1769:7:0
// ElementaryTypeNameExpression#135 (1937:7:0) -> 1769:7:0
// Identifier#136 (1945:4:0) -> 1777:4:0
// FunctionCall#137 (1937:13:0) -> 1769:13:0
// Identifier#138 (1952:7:0) -> 1784:7:0
// FunctionCall#139 (1931:29:0) -> 1763:29:0
// EmitStatement#140 (1926:34:0) -> 1758:34:0
// Block#141 (1905:62:0) -> 1737:62:0
// ModifierDefinition#142 (1859:108:0) -> 1691:108:0
// ElementaryTypeName#143 (1985:4:0) -> 1817:4:0
// VariableDeclaration#144 (1985:6:0) -> 1817:6:0
// ParameterList#145 (1984:8:0) -> 1816:8:0
// Identifier#147 (2010:13:0) -> 1842:13:0
// Identifier#148 (2026:1:0) -> 1858:1:0
// Assignment#149 (2010:17:0) -> 1842:17:0
// ExpressionStatement#150 (2010:17:0) -> 1842:17:0
// Block#151 (2000:34:0) -> 1832:34:0
// FunctionDefinition#152 (1973:61:0) -> 1805:61:0
// ElementaryTypeName#153 (2062:7:0) -> 1894:7:0
// VariableDeclaration#154 (2062:9:0) -> 1894:9:0
// ParameterList#155 (2061:11:0) -> 1893:11:0
// OverrideSpecifier#156 (2073:8:0) -> 1905:8:0
// ElementaryTypeName#157 (2100:15:0) -> 1932:15:0
// VariableDeclaration#158 (2100:15:0) -> 1932:15:0
// ParameterList#159 (2099:17:0) -> 1931:17:0
// ElementaryTypeName#160 (2134:8:0) -> 1966:7:0
// ElementaryTypeNameExpression#161 (2134:8:0) -> 1966:7:0
// Identifier#162 (2142:1:0) -> 1974:1:0
// FunctionCall#163 (2134:10:0) -> 1966:10:0
// Return#164 (2127:17:0) -> 1959:17:0
// Block#165 (2117:34:0) -> 1949:34:0
// FunctionDefinition#166 (2040:111:0) -> 1872:111:0
// ParameterList#167 (2182:2:0) -> 2014:2:0
// Block#169 (2199:2:0) -> 2031:2:0
// FunctionDefinition#170 (2157:44:0) -> 1989:44:0
// ParameterList#171 (2226:2:0) -> 2058:2:0
// Identifier#173 (2246:6:0) -> 2078:6:0
// Identifier#174 (2253:4:0) -> 2085:4:0
// ElementaryTypeName#175 (2258:4:0) -> 2090:4:0
// ElementaryTypeNameExpression#176 (2258:4:0) -> 2090:4:0
// FunctionCall#177 (2253:10:0) -> 2085:10:0
// MemberAccess#178 (2253:14:0) -> 2085:14:0
// Literal#179 (2271:1:0) -> 2103:1:0
// BinaryOperation#180 (2253:19:0) -> 2085:19:0
// FunctionCall#181 (2246:27:0) -> 2078:27:0
// ExpressionStatement#182 (2246:27:0) -> 2078:27:0
// Identifier#183 (2283:6:0) -> 2115:6:0
// Identifier#184 (2290:4:0) -> 2122:4:0
// ElementaryTypeName#185 (2295:4:0) -> 2127:4:0
// ElementaryTypeNameExpression#186 (2295:4:0) -> 2127:4:0
// FunctionCall#187 (2290:10:0) -> 2122:10:0
// MemberAccess#188 (2290:14:0) -> 2122:14:0
// Literal#189 (2308:78:0) -> 2140:78:0
// BinaryOperation#190 (2290:96:0) -> 2122:96:0
// FunctionCall#191 (2283:104:0) -> 2115:104:0
// ExpressionStatement#192 (2283:104:0) -> 2115:104:0
// Identifier#193 (2397:6:0) -> 2229:6:0
// Identifier#194 (2404:4:0) -> 2236:4:0
// ElementaryTypeName#195 (2409:6:0) -> 2241:6:0
// ElementaryTypeNameExpression#196 (2409:6:0) -> 2241:6:0
// FunctionCall#197 (2404:12:0) -> 2236:12:0
// MemberAccess#198 (2404:16:0) -> 2236:16:0
// Literal#199 (2426:77:0) -> 2258:77:0
// UnaryOperation#200 (2425:78:0) -> 2257:78:0
// TupleExpression#201 (2424:80:0) -> 2256:80:0
// BinaryOperation#202 (2404:100:0) -> 2236:100:0
// FunctionCall#203 (2397:108:0) -> 2229:108:0
// ExpressionStatement#204 (2397:108:0) -> 2229:108:0
// Identifier#205 (2515:6:0) -> 2347:6:0
// Identifier#206 (2522:4:0) -> 2354:4:0
// ElementaryTypeName#207 (2527:6:0) -> 2359:6:0
// ElementaryTypeNameExpression#208 (2527:6:0) -> 2359:6:0
// FunctionCall#209 (2522:12:0) -> 2354:12:0
// MemberAccess#210 (2522:16:0) -> 2354:16:0
// Literal#211 (2542:77:0) -> 2374:77:0
// BinaryOperation#212 (2522:97:0) -> 2354:97:0
// FunctionCall#213 (2515:105:0) -> 2347:105:0
// ExpressionStatement#214 (2515:105:0) -> 2347:105:0
// Block#215 (2236:391:0) -> 2068:391:0
// FunctionDefinition#216 (2207:420:0) -> 2039:420:0
// StructuredDocumentation#217 (2633:26:0) -> 2465:26:0
// ParameterList#218 (2688:2:0) -> 2520:2:0
// ElementaryTypeName#219 (2712:6:0) -> 2544:6:0
// VariableDeclaration#220 (2712:6:0) -> 2544:6:0
// ParameterList#221 (2711:8:0) -> 2543:8:0
// Identifier#222 (2737:4:0) -> 2569:4:0
// Identifier#223 (2742:15:0) -> 2574:15:0
// FunctionCall#224 (2737:21:0) -> 2569:21:0
// MemberAccess#225 (2737:33:0) -> 2569:33:0
// Return#226 (2730:40:0) -> 2562:40:0
// Block#227 (2720:57:0) -> 2552:57:0
// FunctionDefinition#228 (2664:113:0) -> 2496:113:0
// StructuredDocumentation#229 (2783:31:0) -> 2615:31:0
// ParameterList#230 (2838:2:0) -> 2670:2:0
// ElementaryTypeName#232 (2864:4:0) -> 2696:4:0
// VariableDeclaration#233 (2864:6:0) -> 2696:6:0
// ElementaryTypeName#234 (2872:4:0) -> 2704:4:0
// VariableDeclaration#235 (2872:6:0) -> 2704:6:0
// Identifier#236 (2882:3:0) -> 2714:3:0
// MemberAccess#237 (2882:10:0) -> 2714:10:0
// Identifier#238 (2893:3:0) -> 2725:3:0
// MemberAccess#239 (2893:8:0) -> 2725:8:0
// Literal#240 (2902:1:0) -> 2734:1:0
// Literal#241 (2904:1:0) -> 2736:1:0
// IndexRangeAccess#242 (2893:13:0) -> 2725:13:0
// ElementaryTypeName#243 (2909:4:0) -> 2741:4:0
// ElementaryTypeNameExpression#244 (2909:4:0) -> 2741:4:0
// ElementaryTypeName#245 (2915:4:0) -> 2747:4:0
// ElementaryTypeNameExpression#246 (2915:4:0) -> 2747:4:0
// TupleExpression#247 (2908:12:0) -> 2740:12:0
// FunctionCall#248 (2882:39:0) -> 2714:39:0
// VariableDeclarationStatement#249 (2863:58:0) -> 2695:58:0
// ElementaryTypeName#250 (2932:4:0) -> 2764:4:0
// VariableDeclaration#251 (2932:6:0) -> 2764:6:0
// ElementaryTypeName#252 (2940:4:0) -> 2772:4:0
// VariableDeclaration#253 (2940:6:0) -> 2772:6:0
// Identifier#254 (2950:3:0) -> 2782:3:0
// MemberAccess#255 (2950:10:0) -> 2782:10:0
// Identifier#256 (2961:3:0) -> 2793:3:0
// MemberAccess#257 (2961:8:0) -> 2793:8:0
// Literal#258 (2971:1:0) -> 2803:1:0
// IndexRangeAccess#259 (2961:12:0) -> 2793:12:0
// ElementaryTypeName#260 (2976:4:0) -> 2808:4:0
// ElementaryTypeNameExpression#261 (2976:4:0) -> 2808:4:0
// ElementaryTypeName#262 (2982:4:0) -> 2814:4:0
// ElementaryTypeNameExpression#263 (2982:4:0) -> 2814:4:0
// TupleExpression#264 (2975:12:0) -> 2807:12:0
// FunctionCall#265 (2950:38:0) -> 2782:38:0
// VariableDeclarationStatement#266 (2931:57:0) -> 2763:57:0
// ElementaryTypeName#267 (2999:4:0) -> 2831:4:0
// VariableDeclaration#268 (2999:6:0) -> 2831:6:0
// ElementaryTypeName#269 (3007:4:0) -> 2839:4:0
// VariableDeclaration#270 (3007:6:0) -> 2839:6:0
// Identifier#271 (3017:3:0) -> 2849:3:0
// MemberAccess#272 (3017:10:0) -> 2849:10:0
// Identifier#273 (3028:3:0) -> 2860:3:0
// MemberAccess#274 (3028:8:0) -> 2860:8:0
// Literal#275 (3037:1:0) -> 2869:1:0
// IndexRangeAccess#276 (3028:12:0) -> 2860:12:0
// ElementaryTypeName#277 (3043:4:0) -> 2875:4:0
// ElementaryTypeNameExpression#278 (3043:4:0) -> 2875:4:0
// ElementaryTypeName#279 (3049:4:0) -> 2881:4:0
// ElementaryTypeNameExpression#280 (3049:4:0) -> 2881:4:0
// TupleExpression#281 (3042:12:0) -> 2874:12:0
// FunctionCall#282 (3017:38:0) -> 2849:38:0
// VariableDeclarationStatement#283 (2998:57:0) -> 2830:57:0
// ElementaryTypeName#284 (3066:4:0) -> 2898:4:0
// VariableDeclaration#285 (3066:6:0) -> 2898:6:0
// ElementaryTypeName#286 (3074:4:0) -> 2906:4:0
// VariableDeclaration#287 (3074:6:0) -> 2906:6:0
// Identifier#288 (3084:3:0) -> 2916:3:0
// MemberAccess#289 (3084:10:0) -> 2916:10:0
// Identifier#290 (3095:3:0) -> 2927:3:0
// MemberAccess#291 (3095:8:0) -> 2927:8:0
// IndexRangeAccess#292 (3095:11:0) -> 2927:11:0
// ElementaryTypeName#293 (3109:4:0) -> 2941:4:0
// ElementaryTypeNameExpression#294 (3109:4:0) -> 2941:4:0
// ElementaryTypeName#295 (3115:4:0) -> 2947:4:0
// ElementaryTypeNameExpression#296 (3115:4:0) -> 2947:4:0
// TupleExpression#297 (3108:12:0) -> 2940:12:0
// FunctionCall#298 (3084:37:0) -> 2916:37:0
// VariableDeclarationStatement#299 (3065:56:0) -> 2897:56:0
// ElementaryTypeName#300 (3132:4:0) -> 2964:4:0
// VariableDeclaration#301 (3132:6:0) -> 2964:6:0
// ElementaryTypeName#302 (3140:4:0) -> 2972:4:0
// VariableDeclaration#303 (3140:6:0) -> 2972:6:0
// Identifier#304 (3150:3:0) -> 2982:3:0
// MemberAccess#305 (3150:10:0) -> 2982:10:0
// Identifier#306 (3161:3:0) -> 2993:3:0
// MemberAccess#307 (3161:8:0) -> 2993:8:0
// ElementaryTypeName#308 (3172:4:0) -> 3004:4:0
// ElementaryTypeNameExpression#309 (3172:4:0) -> 3004:4:0
// ElementaryTypeName#310 (3178:4:0) -> 3010:4:0
// ElementaryTypeNameExpression#311 (3178:4:0) -> 3010:4:0
// TupleExpression#312 (3171:12:0) -> 3003:12:0
// FunctionCall#313 (3150:34:0) -> 2982:34:0
// VariableDeclarationStatement#314 (3131:53:0) -> 2963:53:0
// Block#315 (2853:338:0) -> 2685:338:0
// FunctionDefinition#316 (2819:372:0) -> 2651:372:0
// ParameterList#317 (3218:2:0) -> 3050:2:0
// Identifier#318 (3228:13:0) -> 3060:13:0
// Literal#319 (3242:25:0) -> 3074:25:0
// ModifierInvocation#320 (3228:40:0) -> 3060:40:0
// UserDefinedTypeName#322 (3287:5:0) -> 3119:5:0
// NewExpression#323 (3283:9:0) -> 3115:9:0
// FunctionCall#324 (3283:11:0) -> 3115:11:0
// ElementaryTypeName#325 (3309:3:0) -> 3141:3:0
// VariableDeclaration#326 (3309:5:0) -> 3141:5:0
// Literal#327 (3317:1:0) -> 3149:1:0
// VariableDeclarationStatement#328 (3309:9:0) -> 3141:9:0
// Block#329 (3295:34:0) -> 3127:34:0
// TryCatchClause#330 (3295:34:0) -> 3127:34:0
// ElementaryTypeName#331 (3350:3:0) -> 3182:3:0
// VariableDeclaration#332 (3350:5:0) -> 3182:5:0
// Literal#333 (3358:1:0) -> 3190:1:0
// VariableDeclarationStatement#334 (3350:9:0) -> 3182:9:0
// Block#335 (3336:34:0) -> 3168:34:0
// TryCatchClause#336 (3330:40:0) -> 3162:40:0
// TryStatement#337 (3279:91:0) -> 3111:91:0
// UserDefinedTypeName#338 (3387:12:0) -> 3219:12:0
// NewExpression#339 (3383:16:0) -> 3215:16:0
// Literal#340 (3406:3:0) -> 3238:3:0
// Literal#341 (3418:7:0) -> 3250:7:0
// FunctionCallOptions#342 (3383:43:0) -> 3215:43:0
// FunctionCall#343 (3383:45:0) -> 3215:45:0
// UserDefinedTypeName#344 (3438:12:0) -> 3270:12:0
// VariableDeclaration#345 (3438:14:0) -> 3270:14:0
// ParameterList#346 (3437:16:0) -> 3269:16:0
// ElementaryTypeName#347 (3468:3:0) -> 3300:3:0
// VariableDeclaration#348 (3468:5:0) -> 3300:5:0
// Literal#349 (3476:1:0) -> 3308:1:0
// VariableDeclarationStatement#350 (3468:9:0) -> 3300:9:0
// Block#351 (3454:34:0) -> 3286:34:0
// TryCatchClause#352 (3429:59:0) -> 3261:59:0
// ElementaryTypeName#353 (3501:6:0) -> 3333:6:0
// VariableDeclaration#354 (3501:20:0) -> 3333:20:0
// ParameterList#355 (3500:22:0) -> 3332:22:0
// Block#356 (3523:2:0) -> 3355:2:0
// TryCatchClause#357 (3489:36:0) -> 3321:36:0
// ElementaryTypeName#358 (3533:5:0) -> 3365:5:0
// VariableDeclaration#359 (3533:25:0) -> 3365:25:0
// ParameterList#360 (3532:27:0) -> 3364:27:0
// Block#361 (3560:2:0) -> 3392:2:0
// TryCatchClause#362 (3526:36:0) -> 3358:36:0
// TryStatement#363 (3379:183:0) -> 3211:183:0
// Block#364 (3269:299:0) -> 3101:299:0
// FunctionDefinition#365 (3197:371:0) -> 3029:371:0
// ParameterList#366 (3591:2:0) -> 3423:2:0
// Identifier#368 (3611:6:0) -> 3443:6:0
// Literal#369 (3618:6:0) -> 3450:6:0
// Literal#370 (3628:14:0) -> 3460:14:0
// BinaryOperation#371 (3618:24:0) -> 3450:24:0
// FunctionCall#372 (3611:32:0) -> 3443:32:0
// ExpressionStatement#373 (3611:32:0) -> 3443:32:0
// Identifier#374 (3653:6:0) -> 3485:6:0
// Literal#375 (3660:6:0) -> 3492:6:0
// Literal#376 (3670:11:0) -> 3502:11:0
// BinaryOperation#377 (3660:21:0) -> 3492:21:0
// FunctionCall#378 (3653:29:0) -> 3485:29:0
// ExpressionStatement#379 (3653:29:0) -> 3485:29:0
// Block#380 (3601:88:0) -> 3433:88:0
// FunctionDefinition#381 (3574:115:0) -> 3406:115:0
// ParameterList#382 (3722:2:0) -> 3554:2:0
// Identifier#383 (3734:22:0) -> 3566:22:0
// ModifierInvocation#384 (3734:24:0) -> 3566:24:0
// ElementaryTypeName#385 (3768:4:0) -> 3600:4:0
// VariableDeclaration#386 (3768:4:0) -> 3600:4:0
// ParameterList#387 (3767:6:0) -> 3599:6:0
// ElementaryTypeName#388 (3793:7:0) -> 3625:7:0
// VariableDeclaration#389 (3793:7:0) -> 3625:7:0
// ParameterList#390 (3792:9:0) -> 3624:9:0
// ElementaryTypeName#391 (3820:15:0) -> 3652:15:0
// VariableDeclaration#392 (3820:15:0) -> 3652:15:0
// ParameterList#393 (3819:17:0) -> 3651:17:0
// FunctionTypeName#394 (3784:62:0) -> 3616:52:0
// VariableDeclaration#395 (3784:62:0) -> 3616:62:0
// Identifier#396 (3849:10:0) -> 3681:10:0
// MemberAccess#397 (3849:23:0) -> 3681:23:0
// VariableDeclarationStatement#398 (3784:88:0) -> 3616:88:0
// ParameterList#399 (3890:2:0) -> 3722:2:0
// FunctionTypeName#401 (3882:28:0) -> 3714:24:0
// VariableDeclaration#402 (3882:28:0) -> 3714:28:0
// Identifier#403 (3913:10:0) -> 3745:10:0
// MemberAccess#404 (3913:27:0) -> 3745:27:0
// VariableDeclarationStatement#405 (3882:58:0) -> 3714:58:0
// ElementaryTypeName#408 (3950:4:0) -> 3782:4:0
// ArrayTypeName#409 (3950:6:0) -> 3782:6:0
// VariableDeclaration#410 (3950:18:0) -> 3782:18:0
// ElementaryTypeName#411 (3975:4:0) -> 3807:4:0
// ArrayTypeName#412 (3975:6:0) -> 3807:6:0
// NewExpression#413 (3971:10:0) -> 3803:10:0
// Literal#414 (3982:1:0) -> 3814:1:0
// FunctionCall#415 (3971:13:0) -> 3803:13:0
// VariableDeclarationStatement#416 (3950:34:0) -> 3782:34:0
// Identifier#417 (3994:4:0) -> 3826:4:0
// Literal#418 (3999:1:0) -> 3831:1:0
// IndexAccess#419 (3994:7:0) -> 3826:7:0
// Literal#420 (4004:1:0) -> 3836:1:0
// Assignment#421 (3994:11:0) -> 3826:11:0
// ExpressionStatement#422 (3994:11:0) -> 3826:11:0
// Identifier#423 (4015:4:0) -> 3847:4:0
// Literal#424 (4020:1:0) -> 3852:1:0
// IndexAccess#425 (4015:7:0) -> 3847:7:0
// Literal#426 (4025:1:0) -> 3857:1:0
// Assignment#427 (4015:11:0) -> 3847:11:0
// ExpressionStatement#428 (4015:11:0) -> 3847:11:0
// Identifier#429 (4036:4:0) -> 3868:4:0
// Literal#430 (4041:1:0) -> 3873:1:0
// IndexAccess#431 (4036:7:0) -> 3868:7:0
// Literal#432 (4046:1:0) -> 3878:1:0
// Assignment#433 (4036:11:0) -> 3868:11:0
// ExpressionStatement#434 (4036:11:0) -> 3868:11:0
// UserDefinedTypeName#435 (4057:12:0) -> 3889:12:0
// VariableDeclaration#436 (4057:21:0) -> 3889:21:0
// Identifier#437 (4081:12:0) -> 3913:12:0
// Literal#438 (4094:1:0) -> 3926:1:0
// Identifier#439 (4097:4:0) -> 3929:4:0
// FunctionCall#440 (4081:21:0) -> 3913:21:0
// VariableDeclarationStatement#441 (4057:45:0) -> 3889:45:0
// ElementaryTypeName#444 (4112:4:0) -> 3944:4:0
// ArrayTypeName#445 (4112:6:0) -> 3944:6:0
// VariableDeclaration#446 (4112:15:0) -> 3944:15:0
// Identifier#447 (4130:1:0) -> 3962:1:0
// MemberAccess#448 (4130:3:0) -> 3962:3:0
// VariableDeclarationStatement#449 (4112:21:0) -> 3944:21:0
// Identifier#450 (4150:1:0) -> 3982:1:0
// UnaryOperation#451 (4143:8:0) -> 3975:8:0
// ExpressionStatement#452 (4143:8:0) -> 3975:8:0
// ElementaryTypeName#453 (4161:4:0) -> 3993:4:0
// VariableDeclaration#454 (4161:6:0) -> 3993:6:0
// Identifier#455 (4170:1:0) -> 4002:1:0
// Literal#456 (4172:1:0) -> 4004:1:0
// IndexAccess#457 (4170:4:0) -> 4002:4:0
// VariableDeclarationStatement#458 (4161:13:0) -> 3993:13:0
// Identifier#459 (4191:1:0) -> 4023:1:0
// UnaryOperation#460 (4184:8:0) -> 4016:8:0
// ExpressionStatement#461 (4184:8:0) -> 4016:8:0
// Identifier#462 (4209:1:0) -> 4041:1:0
// Return#463 (4202:8:0) -> 4034:8:0
// Block#464 (3774:443:0) -> 3606:443:0
// FunctionDefinition#465 (3695:522:0) -> 3527:522:0
// ParameterList#466 (4245:2:0) -> 4077:2:0
// Identifier#468 (4265:4:0) -> 4097:4:0
// MemberAccess#471 (4265:15:0) -> 4097:15:0
// MemberAccess#472 (4265:24:0) -> 4097:24:0
// ExpressionStatement#473 (4265:24:0) -> 4097:24:0
// Identifier#474 (4299:13:0) -> 4131:13:0
// MemberAccess#477 (4299:42:0) -> 4131:42:0
// MemberAccess#478 (4299:51:0) -> 4131:51:0
// ExpressionStatement#479 (4299:51:0) -> 4131:51:0
// Identifier#480 (4360:15:0) -> 4192:15:0
// MemberAccess#483 (4360:23:0) -> 4192:23:0
// MemberAccess#484 (4360:32:0) -> 4192:32:0
// ExpressionStatement#485 (4360:32:0) -> 4192:32:0
// Block#486 (4255:144:0) -> 4087:144:0
// FunctionDefinition#487 (4223:176:0) -> 4055:176:0
// ElementaryTypeName#488 (4436:4:0) -> 4268:4:0
// ArrayTypeName#489 (4436:6:0) -> 4268:6:0
// VariableDeclaration#490 (4436:15:0) -> 4268:15:0
// ParameterList#491 (4435:17:0) -> 4267:17:0
// ElementaryTypeName#492 (4471:4:0) -> 4303:4:0
// ArrayTypeName#493 (4471:6:0) -> 4303:6:0
// VariableDeclaration#494 (4471:13:0) -> 4303:13:0
// ParameterList#495 (4470:15:0) -> 4302:15:0
// Identifier#496 (4496:4:0) -> 4328:4:0
// Identifier#497 (4503:1:0) -> 4335:1:0
// Assignment#498 (4496:8:0) -> 4328:8:0
// ExpressionStatement#499 (4496:8:0) -> 4328:8:0
// ElementaryTypeName#502 (4514:4:0) -> 4346:4:0
// ArrayTypeName#503 (4514:6:0) -> 4346:6:0
// VariableDeclaration#504 (4514:16:0) -> 4346:16:0
// VariableDeclarationStatement#505 (4514:16:0) -> 4346:16:0
// Identifier#506 (4540:1:0) -> 4372:1:0
// Identifier#507 (4544:4:0) -> 4376:4:0
// Assignment#508 (4540:8:0) -> 4372:8:0
// ExpressionStatement#509 (4540:8:0) -> 4372:8:0
// Identifier#510 (4565:1:0) -> 4397:1:0
// Return#511 (4558:8:0) -> 4390:8:0
// Block#512 (4486:87:0) -> 4318:87:0
// FunctionDefinition#513 (4405:168:0) -> 4237:168:0
// ParameterList#514 (4586:2:0) -> 4418:2:0
// Block#516 (4606:2:0) -> 4438:2:0
// FunctionDefinition#517 (4579:29:0) -> 4411:29:0
// ParameterList#518 (4622:2:0) -> 4454:2:0
// Block#520 (4634:2:0) -> 4466:2:0
// FunctionDefinition#521 (4614:22:0) -> 4446:22:0
// ContractDefinition#522 (1241:3397:0) -> 1074:3396:0
// StructuredDocumentation#523 (4669:29:0) -> 4501:29:0
// ElementaryTypeName#524 (4703:4:0) -> 4535:4:0
// ArrayTypeName#525 (4703:6:0) -> 4535:6:0
// VariableDeclaration#526 (4703:22:0) -> 4535:22:0
// ElementaryTypeName#527 (4751:4:0) -> 4583:4:0
// ArrayTypeName#528 (4751:6:0) -> 4583:6:0
// ArrayTypeName#529 (4751:8:0) -> 4583:8:0
// VariableDeclaration#530 (4751:22:0) -> 4583:22:0
// ElementaryTypeName#531 (4775:4:0) -> 4607:4:0
// VariableDeclaration#532 (4775:10:0) -> 4607:10:0
// ParameterList#533 (4750:36:0) -> 4582:36:0
// ElementaryTypeName#534 (4809:4:0) -> 4641:4:0
// ArrayTypeName#535 (4809:6:0) -> 4641:6:0
// VariableDeclaration#536 (4809:15:0) -> 4641:15:0
// ParameterList#537 (4808:17:0) -> 4640:17:0
// Identifier#538 (4836:7:0) -> 4668:7:0
// Identifier#539 (4844:4:0) -> 4676:4:0
// MemberAccess#540 (4844:11:0) -> 4676:11:0
// Identifier#541 (4858:5:0) -> 4690:5:0
// BinaryOperation#542 (4844:19:0) -> 4676:19:0
// Literal#543 (4865:29:0) -> 4697:29:0
// FunctionCall#544 (4836:59:0) -> 4668:59:0
// ExpressionStatement#545 (4836:59:0) -> 4668:59:0
// ElementaryTypeName#548 (4943:4:0) -> 4737:4:0
// ArrayTypeName#549 (4943:6:0) -> 4737:6:0
// VariableDeclaration#550 (4943:19:0) -> 4737:19:0
// Identifier#551 (4965:4:0) -> 4759:4:0
// Identifier#552 (4970:5:0) -> 4764:5:0
// IndexAccess#553 (4965:11:0) -> 4759:11:0
// VariableDeclarationStatement#554 (4943:33:0) -> 4737:33:0
// Identifier#555 (4993:3:0) -> 4787:3:0
// Return#556 (4986:10:0) -> 4780:10:0
// Block#557 (4826:177:0) -> 4658:139:0
// FunctionDefinition#558 (4732:271:0) -> 4564:233:0
// ElementaryTypeName#559 (5028:4:0) -> 4822:4:0
// ArrayTypeName#560 (5028:6:0) -> 4822:6:0
// ArrayTypeName#561 (5028:8:0) -> 4822:8:0
// VariableDeclaration#562 (5028:22:0) -> 4822:22:0
// ParameterList#563 (5027:24:0) -> 4821:24:0
// ElementaryTypeName#567 (5069:4:0) -> 4863:4:0
// ArrayTypeName#568 (5069:6:0) -> 4863:6:0
// VariableDeclaration#569 (5069:19:0) -> 4863:19:0
// Identifier#570 (5091:9:0) -> 4885:9:0
// Identifier#571 (5101:4:0) -> 4895:4:0
// Literal#572 (5107:1:0) -> 4901:1:0
// FunctionCall#573 (5091:18:0) -> 4885:18:0
// VariableDeclarationStatement#574 (5069:40:0) -> 4863:40:0
// Identifier#575 (5119:11:0) -> 4913:11:0
// Identifier#576 (5131:3:0) -> 4925:3:0
// FunctionCall#577 (5119:16:0) -> 4913:16:0
// ExpressionStatement#578 (5119:16:0) -> 4913:16:0
// ElementaryTypeName#579 (5150:4:0) -> 4944:4:0
// VariableDeclaration#580 (5150:6:0) -> 4944:6:0
// Literal#581 (5159:1:0) -> 4953:1:0
// VariableDeclarationStatement#582 (5150:10:0) -> 4944:10:0
// Identifier#583 (5162:1:0) -> 4956:1:0
// Identifier#584 (5166:3:0) -> 4960:3:0
// MemberAccess#585 (5166:10:0) -> 4960:10:0
// BinaryOperation#586 (5162:14:0) -> 4956:14:0
// Identifier#587 (5178:1:0) -> 4972:1:0
// UnaryOperation#588 (5178:3:0) -> 4972:3:0
// ExpressionStatement#589 (5178:3:0) -> 4972:3:0
// Identifier#590 (5197:6:0) -> 4991:6:0
// MemberAccess#592 (5197:11:0) -> 4991:11:0
// Identifier#593 (5209:3:0) -> 5003:3:0
// Identifier#594 (5213:1:0) -> 5007:1:0
// IndexAccess#595 (5209:6:0) -> 5003:6:0
// FunctionCall#596 (5197:19:0) -> 4991:19:0
// ExpressionStatement#597 (5197:19:0) -> 4991:19:0
// Block#598 (5183:44:0) -> 4977:44:0
// ForStatement#599 (5145:82:0) -> 4939:82:0
// Block#600 (5059:174:0) -> 4853:174:0
// FunctionDefinition#601 (5009:224:0) -> 4803:224:0
// ElementaryTypeName#602 (5260:4:0) -> 5054:4:0
// ArrayTypeName#603 (5260:6:0) -> 5054:6:0
// VariableDeclaration#604 (5260:25:0) -> 5054:25:0
// ParameterList#605 (5259:27:0) -> 5053:27:0
// ElementaryTypeName#607 (5316:4:0) -> 5110:4:0
// VariableDeclaration#608 (5316:6:0) -> 5110:6:0
// Literal#609 (5325:1:0) -> 5119:1:0
// VariableDeclarationStatement#610 (5316:10:0) -> 5110:10:0
// Identifier#611 (5328:1:0) -> 5122:1:0
// Identifier#612 (5332:9:0) -> 5126:9:0
// MemberAccess#613 (5332:16:0) -> 5126:16:0
// BinaryOperation#614 (5328:20:0) -> 5122:20:0
// Identifier#615 (5350:1:0) -> 5144:1:0
// UnaryOperation#616 (5350:3:0) -> 5144:3:0
// ExpressionStatement#617 (5350:3:0) -> 5144:3:0
// ElementaryTypeName#618 (5374:4:0) -> 5168:4:0
// VariableDeclaration#619 (5374:6:0) -> 5168:6:0
// Identifier#620 (5383:1:0) -> 5177:1:0
// Literal#621 (5387:1:0) -> 5181:1:0
// BinaryOperation#622 (5383:5:0) -> 5177:5:0
// VariableDeclarationStatement#623 (5374:14:0) -> 5168:14:0
// Identifier#624 (5390:1:0) -> 5184:1:0
// Identifier#625 (5394:9:0) -> 5188:9:0
// MemberAccess#626 (5394:16:0) -> 5188:16:0
// BinaryOperation#627 (5390:20:0) -> 5184:20:0
// Identifier#628 (5412:1:0) -> 5206:1:0
// UnaryOperation#629 (5412:3:0) -> 5206:3:0
// ExpressionStatement#630 (5412:3:0) -> 5206:3:0
// Identifier#631 (5435:7:0) -> 5229:7:0
// Identifier#632 (5443:9:0) -> 5237:9:0
// Identifier#633 (5453:1:0) -> 5247:1:0
// IndexAccess#634 (5443:12:0) -> 5237:12:0
// Identifier#635 (5459:9:0) -> 5253:9:0
// Identifier#636 (5469:1:0) -> 5263:1:0
// IndexAccess#637 (5459:12:0) -> 5253:12:0
// BinaryOperation#638 (5443:28:0) -> 5237:28:0
// FunctionCall#639 (5435:37:0) -> 5229:37:0
// ExpressionStatement#640 (5435:37:0) -> 5229:37:0
// Block#641 (5417:70:0) -> 5211:70:0
// ForStatement#642 (5369:118:0) -> 5163:118:0
// Block#643 (5355:142:0) -> 5149:142:0
// ForStatement#644 (5311:186:0) -> 5105:186:0
// Block#645 (5301:202:0) -> 5095:202:0
// FunctionDefinition#646 (5239:264:0) -> 5033:264:0
// ContractDefinition#647 (4640:865:0) -> 4472:827:0
// ParameterList#648 (5550:2:0) -> 5344:2:0
// ElementaryTypeName#649 (5576:15:0) -> 5370:15:0
// VariableDeclaration#650 (5576:15:0) -> 5370:15:0
// ParameterList#651 (5575:17:0) -> 5369:17:0
// FunctionDefinition#652 (5537:56:0) -> 5331:56:0
// ContractDefinition#653 (5507:88:0) -> 5301:88:0
// UserDefinedTypeName#654 (5627:13:0) -> 5421:13:0
// InheritanceSpecifier#655 (5627:13:0) -> 5421:13:0
// StructuredDocumentation#656 (5647:60:0) -> 5441:59:0
// ElementaryTypeName#657 (5712:15:0) -> 5505:15:0
// OverrideSpecifier#658 (5745:8:0) -> 5538:8:0
// ElementaryTypeName#659 (5761:7:0) -> 5554:7:0
// ElementaryTypeNameExpression#660 (5761:7:0) -> 5554:7:0
// Literal#661 (5769:3:0) -> 5562:3:0
// FunctionCall#662 (5761:12:0) -> 5554:12:0
// VariableDeclaration#663 (5712:61:0) -> 5505:61:0
// ContractDefinition#664 (5597:179:0) -> 5391:178:0
// SourceUnit#665 (167:5610:0) -> 0:5569:0
