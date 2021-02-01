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
        return (((base ** pow)));
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
        require(((some > 0)), "Failure");
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
        assert(((type(uint).min == 0)));
        assert(((type(uint).max == 115792089237316195423570985008687907853269984665640564039457584007913129639935)));
        assert(((type(int256).min == ((-57896044618658097711785492504343953926634992332820282019728792003956564819968)))));
        assert(((type(int256).max == 57896044618658097711785492504343953926634992332820282019728792003956564819967)));
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
        } catch  {
            int b = 2;
        }
        try new EmptyPayable{salt: 0x0, value: 1 ether}() returns (EmptyPayable x) {
            int a = 1;
        } catch Error(string memory reason) {} catch (bytes memory lowLevelData) {}
    }

    function testGWei() public {
        assert(((1 gwei == 1000000000 wei)));
        assert(((1 gwei == 0.001 szabo)));
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
        require(((rows.length > index)), "Rows does not contain index");
        uint[] calldata row = rows[index];
        return row;
    }

    function addOwners(uint[][] calldata rows) public {
        uint[] calldata row = returnRow(rows, 0);
        checkUnique(row);
        for (uint i = 0; ((i < row.length)); ((i++))) {
            values.push(row[i]);
        }
    }

    function checkUnique(uint[] calldata newValues) internal pure {
        for (uint i = 0; ((i < newValues.length)); ((i++))) {
            for (uint j = ((i + 1)); ((i < newValues.length)); ((j++))) {
                require(((newValues[i] != newValues[i])));
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
// SourceUnit#682 (168:5595:0) -> 0:5628:0
// PragmaDirective#1 (168:23:0) -> 0:23:0
// PragmaDirective#2 (192:33:0) -> 24:33:0
// PragmaDirective#3 (226:31:0) -> 58:31:0
// EnumDefinition#7 (259:27:0) -> 91:27:0
// EnumValue#4 (277:1:0) -> 109:1:0
// EnumValue#5 (280:1:0) -> 112:1:0
// EnumValue#6 (283:1:0) -> 115:1:0
// StructDefinition#25 (288:148:0) -> 120:148:0
// VariableDeclaration#9 (314:5:0) -> 146:5:0
// ElementaryTypeName#8 (314:3:0) -> 146:3:0
// VariableDeclaration#12 (325:8:0) -> 157:8:0
// ArrayTypeName#11 (325:6:0) -> 157:6:0
// ElementaryTypeName#10 (325:4:0) -> 157:4:0
// VariableDeclaration#16 (339:26:0) -> 171:26:0
// Mapping#15 (339:24:0) -> 171:24:0
// ElementaryTypeName#13 (347:7:0) -> 179:7:0
// ElementaryTypeName#14 (358:4:0) -> 190:4:0
// VariableDeclaration#20 (371:32:0) -> 203:32:0
// Mapping#19 (371:30:0) -> 203:30:0
// UserDefinedTypeName#17 (379:10:0) -> 211:10:0
// ElementaryTypeName#18 (393:7:0) -> 225:7:0
// VariableDeclaration#24 (409:24:0) -> 241:24:0
// Mapping#23 (409:22:0) -> 241:22:0
// UserDefinedTypeName#21 (417:5:0) -> 249:5:0
// ElementaryTypeName#22 (426:4:0) -> 258:4:0
// ContractDefinition#43 (503:148:0) -> 270:215:0
// StructuredDocumentation#26 (438:65:0) -> 270:65:0
// FunctionDefinition#42 (531:118:0) -> 363:120:0
// ParameterList#31 (568:20:0) -> 400:20:0
// VariableDeclaration#28 (569:8:0) -> 401:8:0
// ElementaryTypeName#27 (569:3:0) -> 401:3:0
// VariableDeclaration#30 (579:8:0) -> 411:8:0
// ElementaryTypeName#29 (579:4:0) -> 411:4:0
// ParameterList#34 (604:5:0) -> 436:5:0
// VariableDeclaration#33 (605:3:0) -> 437:3:0
// ElementaryTypeName#32 (605:3:0) -> 437:3:0
// Block#41 (610:39:0) -> 442:41:0
// Return#40 (620:22:0) -> 452:25:0
// TupleExpression#39 (627:15:0) -> 459:17:0
// TupleExpression#38 (628:13:0) -> 460:15:0
// BinaryOperation#37 (629:11:0) -> 461:13:0
// Identifier#35 (629:4:0) -> 462:4:0
// Identifier#36 (637:3:0) -> 470:3:0
// ContractDefinition#52 (727:102:0) -> 487:176:0
// StructuredDocumentation#44 (653:74:0) -> 487:74:0
// FunctionDefinition#51 (759:68:0) -> 593:68:0
// ParameterList#47 (775:19:0) -> 609:19:0
// VariableDeclaration#46 (776:17:0) -> 610:17:0
// ElementaryTypeName#45 (776:6:0) -> 610:6:0
// ParameterList#50 (812:14:0) -> 646:14:0
// VariableDeclaration#49 (813:12:0) -> 647:12:0
// ElementaryTypeName#48 (813:5:0) -> 647:5:0
// ContractDefinition#77 (831:281:0) -> 665:280:0
// VariableDeclaration#54 (870:17:0) -> 704:17:0
// ElementaryTypeName#53 (870:3:0) -> 704:3:0
// ModifierDefinition#59 (935:36:0) -> 728:76:0
// StructuredDocumentation#55 (894:36:0) -> 728:40:0
// ParameterList#58 (955:7:0) -> 788:7:0
// VariableDeclaration#57 (956:5:0) -> 789:5:0
// ElementaryTypeName#56 (956:3:0) -> 789:3:0
// FunctionDefinition#69 (977:51:0) -> 810:51:0
// ParameterList#62 (988:7:0) -> 821:7:0
// VariableDeclaration#61 (989:5:0) -> 822:5:0
// ElementaryTypeName#60 (989:3:0) -> 822:3:0
// ParameterList#63 (1003:0:0) -> 828:0:0
// Block#68 (1003:25:0) -> 836:25:0
// ExpressionStatement#67 (1013:8:0) -> 846:9:0
// Assignment#66 (1013:8:0) -> 846:8:0
// Identifier#64 (1013:4:0) -> 846:4:0
// Identifier#65 (1020:1:0) -> 853:1:0
// FunctionDefinition#76 (1034:76:0) -> 867:76:0
// ParameterList#72 (1055:11:0) -> 888:11:0
// VariableDeclaration#71 (1056:9:0) -> 889:9:0
// ElementaryTypeName#70 (1056:7:0) -> 889:7:0
// ParameterList#75 (1092:17:0) -> 925:17:0
// VariableDeclaration#74 (1093:15:0) -> 926:15:0
// ElementaryTypeName#73 (1093:15:0) -> 926:15:0
// ContractDefinition#79 (1150:17:0) -> 947:54:0
// StructuredDocumentation#78 (1114:36:0) -> 947:37:0
// ContractDefinition#84 (1169:61:0) -> 1003:61:0
// FunctionDefinition#83 (1197:31:0) -> 1031:31:0
// ParameterList#80 (1208:2:0) -> 1042:2:0
// ParameterList#81 (1226:0:0) -> 1044:0:0
// Block#82 (1226:2:0) -> 1060:2:0
// ContractDefinition#530 (1232:3412:0) -> 1066:3427:0
// InheritanceSpecifier#87 (1255:17:0) -> 1089:17:0
// UserDefinedTypeName#85 (1255:14:0) -> 1089:14:0
// Literal#86 (1270:1:0) -> 1104:1:0
// EventDefinition#94 (1322:44:0) -> 1113:87:0
// StructuredDocumentation#88 (1279:38:0) -> 1113:43:0
// ParameterList#93 (1333:32:0) -> 1167:32:0
// VariableDeclaration#90 (1334:14:0) -> 1168:14:0
// ElementaryTypeName#89 (1334:7:0) -> 1168:7:0
// VariableDeclaration#92 (1350:14:0) -> 1184:14:0
// ElementaryTypeName#91 (1350:6:0) -> 1184:6:0
// VariableDeclaration#97 (1372:35:0) -> 1206:35:0
// ElementaryTypeName#95 (1372:4:0) -> 1206:4:0
// Literal#96 (1406:1:0) -> 1240:1:0
// VariableDeclaration#100 (1413:41:0) -> 1247:41:0
// ElementaryTypeName#98 (1413:4:0) -> 1247:4:0
// Literal#99 (1453:1:0) -> 1283:1:0
// VariableDeclaration#102 (1460:35:0) -> 1294:35:0
// ElementaryTypeName#101 (1460:4:0) -> 1294:4:0
// VariableDeclaration#105 (1501:20:0) -> 1335:20:0
// ArrayTypeName#104 (1501:6:0) -> 1335:6:0
// ElementaryTypeName#103 (1501:4:0) -> 1335:4:0
// ModifierDefinition#117 (1580:74:0) -> 1362:125:0
// StructuredDocumentation#106 (1528:47:0) -> 1362:51:0
// ParameterList#109 (1600:7:0) -> 1433:7:0
// VariableDeclaration#108 (1601:5:0) -> 1434:5:0
// ElementaryTypeName#107 (1601:3:0) -> 1434:3:0
// OverrideSpecifier#110 (1608:8:0) -> 1441:8:0
// Block#116 (1617:37:0) -> 1450:37:0
// PlaceholderStatement#111 (1627:1:0) -> 1460:2:0
// ExpressionStatement#115 (1638:9:0) -> 1471:10:0
// Assignment#114 (1638:9:0) -> 1471:9:0
// Identifier#112 (1638:4:0) -> 1471:4:0
// Identifier#113 (1646:1:0) -> 1479:1:0
// ModifierDefinition#130 (1754:92:0) -> 1493:188:0
// StructuredDocumentation#118 (1660:89:0) -> 1493:94:0
// ParameterList#119 (1785:2:0) -> 1618:2:0
// Block#129 (1788:58:0) -> 1621:60:0
// ExpressionStatement#127 (1798:30:0) -> 1631:33:0
// FunctionCall#126 (1798:30:0) -> 1631:32:0
// Identifier#120 (1798:7:0) -> 1631:7:0
// TupleExpression#124 (1806:10:0) -> 1639:12:0
// BinaryOperation#123 (1807:8:0) -> 1640:10:0
// Identifier#121 (1807:4:0) -> 1641:4:0
// Literal#122 (1814:1:0) -> 1648:1:0
// Literal#125 (1818:9:0) -> 1653:9:0
// PlaceholderStatement#128 (1838:1:0) -> 1673:2:0
// ModifierDefinition#144 (1852:108:0) -> 1687:108:0
// ParameterList#133 (1874:23:0) -> 1709:23:0
// VariableDeclaration#132 (1875:21:0) -> 1710:21:0
// ElementaryTypeName#131 (1875:6:0) -> 1710:6:0
// Block#143 (1898:62:0) -> 1733:62:0
// PlaceholderStatement#134 (1908:1:0) -> 1743:2:0
// EmitStatement#142 (1919:34:0) -> 1754:35:0
// FunctionCall#141 (1924:29:0) -> 1759:29:0
// Identifier#135 (1924:5:0) -> 1759:5:0
// FunctionCall#139 (1930:13:0) -> 1765:13:0
// ElementaryTypeNameExpression#137 (1930:7:0) -> 1765:7:0
// ElementaryTypeName#136 (1930:7:0) -> 1765:7:0
// Identifier#138 (1938:4:0) -> 1773:4:0
// Identifier#140 (1945:7:0) -> 1780:7:0
// FunctionDefinition#154 (1966:61:0) -> 1801:61:0
// ParameterList#147 (1977:8:0) -> 1812:8:0
// VariableDeclaration#146 (1978:6:0) -> 1813:6:0
// ElementaryTypeName#145 (1978:4:0) -> 1813:4:0
// ParameterList#148 (1993:0:0) -> 1820:0:0
// Block#153 (1993:34:0) -> 1828:34:0
// ExpressionStatement#152 (2003:17:0) -> 1838:18:0
// Assignment#151 (2003:17:0) -> 1838:17:0
// Identifier#149 (2003:13:0) -> 1838:13:0
// Identifier#150 (2019:1:0) -> 1854:1:0
// FunctionDefinition#168 (2033:111:0) -> 1868:111:0
// ParameterList#157 (2054:11:0) -> 1889:11:0
// VariableDeclaration#156 (2055:9:0) -> 1890:9:0
// ElementaryTypeName#155 (2055:7:0) -> 1890:7:0
// OverrideSpecifier#158 (2066:8:0) -> 1901:8:0
// ParameterList#161 (2092:17:0) -> 1927:17:0
// VariableDeclaration#160 (2093:15:0) -> 1928:15:0
// ElementaryTypeName#159 (2093:15:0) -> 1928:15:0
// Block#167 (2110:34:0) -> 1945:34:0
// Return#166 (2120:17:0) -> 1955:18:0
// FunctionCall#165 (2127:10:0) -> 1962:10:0
// ElementaryTypeNameExpression#163 (2127:8:0) -> 1962:7:0
// ElementaryTypeName#162 (2127:8:0) -> 1962:7:0
// Identifier#164 (2135:1:0) -> 1970:1:0
// FunctionDefinition#172 (2150:44:0) -> 1985:44:0
// ParameterList#169 (2175:2:0) -> 2010:2:0
// ParameterList#170 (2192:0:0) -> 2012:0:0
// Block#171 (2192:2:0) -> 2027:2:0
// FunctionDefinition#222 (2200:428:0) -> 2035:438:0
// ParameterList#173 (2219:2:0) -> 2054:2:0
// ParameterList#174 (2229:0:0) -> 2056:0:0
// Block#221 (2229:399:0) -> 2064:409:0
// ExpressionStatement#185 (2239:29:0) -> 2074:32:0
// FunctionCall#184 (2239:29:0) -> 2074:31:0
// Identifier#175 (2239:6:0) -> 2074:6:0
// TupleExpression#183 (2246:21:0) -> 2081:23:0
// BinaryOperation#182 (2247:19:0) -> 2082:21:0
// MemberAccess#180 (2247:14:0) -> 2083:14:0
// FunctionCall#179 (2247:10:0) -> 2083:10:0
// Identifier#176 (2247:4:0) -> 2083:4:0
// ElementaryTypeNameExpression#178 (2252:4:0) -> 2088:4:0
// ElementaryTypeName#177 (2252:4:0) -> 2088:4:0
// Literal#181 (2265:1:0) -> 2101:1:0
// ExpressionStatement#196 (2278:106:0) -> 2115:109:0
// FunctionCall#195 (2278:106:0) -> 2115:108:0
// Identifier#186 (2278:6:0) -> 2115:6:0
// TupleExpression#194 (2285:98:0) -> 2122:100:0
// BinaryOperation#193 (2286:96:0) -> 2123:98:0
// MemberAccess#191 (2286:14:0) -> 2124:14:0
// FunctionCall#190 (2286:10:0) -> 2124:10:0
// Identifier#187 (2286:4:0) -> 2124:4:0
// ElementaryTypeNameExpression#189 (2291:4:0) -> 2129:4:0
// ElementaryTypeName#188 (2291:4:0) -> 2129:4:0
// Literal#192 (2304:78:0) -> 2142:78:0
// ExpressionStatement#209 (2394:110:0) -> 2233:115:0
// FunctionCall#208 (2394:110:0) -> 2233:114:0
// Identifier#197 (2394:6:0) -> 2233:6:0
// TupleExpression#207 (2401:102:0) -> 2240:106:0
// BinaryOperation#206 (2402:100:0) -> 2241:104:0
// MemberAccess#202 (2402:16:0) -> 2242:16:0
// FunctionCall#201 (2402:12:0) -> 2242:12:0
// Identifier#198 (2402:4:0) -> 2242:4:0
// ElementaryTypeNameExpression#200 (2407:6:0) -> 2247:6:0
// ElementaryTypeName#199 (2407:6:0) -> 2247:6:0
// TupleExpression#205 (2422:80:0) -> 2262:82:0
// UnaryOperation#204 (2423:78:0) -> 2263:80:0
// Literal#203 (2424:77:0) -> 2265:77:0
// ExpressionStatement#220 (2514:107:0) -> 2357:110:0
// FunctionCall#219 (2514:107:0) -> 2357:109:0
// Identifier#210 (2514:6:0) -> 2357:6:0
// TupleExpression#218 (2521:99:0) -> 2364:101:0
// BinaryOperation#217 (2522:97:0) -> 2365:99:0
// MemberAccess#215 (2522:16:0) -> 2366:16:0
// FunctionCall#214 (2522:12:0) -> 2366:12:0
// Identifier#211 (2522:4:0) -> 2366:4:0
// ElementaryTypeNameExpression#213 (2527:6:0) -> 2371:6:0
// ElementaryTypeName#212 (2527:6:0) -> 2371:6:0
// Literal#216 (2542:77:0) -> 2386:77:0
// FunctionDefinition#234 (2665:113:0) -> 2479:144:0
// StructuredDocumentation#223 (2634:26:0) -> 2479:31:0
// ParameterList#224 (2689:2:0) -> 2534:2:0
// ParameterList#227 (2712:8:0) -> 2557:8:0
// VariableDeclaration#226 (2713:6:0) -> 2558:6:0
// ElementaryTypeName#225 (2713:6:0) -> 2558:6:0
// Block#233 (2721:57:0) -> 2566:57:0
// Return#232 (2731:40:0) -> 2576:41:0
// MemberAccess#231 (2738:33:0) -> 2583:33:0
// FunctionCall#230 (2738:21:0) -> 2583:21:0
// Identifier#228 (2738:4:0) -> 2583:4:0
// Identifier#229 (2743:15:0) -> 2588:15:0
// FunctionDefinition#322 (2820:372:0) -> 2629:408:0
// StructuredDocumentation#235 (2784:31:0) -> 2629:36:0
// ParameterList#236 (2839:2:0) -> 2684:2:0
// ParameterList#237 (2854:0:0) -> 2686:0:0
// Block#321 (2854:338:0) -> 2699:338:0
// VariableDeclarationStatement#255 (2864:58:0) -> 2709:59:0
// VariableDeclaration#239 (2865:6:0) -> 2710:6:0
// ElementaryTypeName#238 (2865:4:0) -> 2710:4:0
// VariableDeclaration#241 (2873:6:0) -> 2718:6:0
// ElementaryTypeName#240 (2873:4:0) -> 2718:4:0
// FunctionCall#254 (2883:39:0) -> 2728:39:0
// MemberAccess#243 (2883:10:0) -> 2728:10:0
// Identifier#242 (2883:3:0) -> 2728:3:0
// IndexRangeAccess#248 (2894:13:0) -> 2739:13:0
// MemberAccess#245 (2894:8:0) -> 2739:8:0
// Identifier#244 (2894:3:0) -> 2739:3:0
// Literal#246 (2903:1:0) -> 2748:1:0
// Literal#247 (2905:1:0) -> 2750:1:0
// TupleExpression#253 (2909:12:0) -> 2754:12:0
// ElementaryTypeNameExpression#250 (2910:4:0) -> 2755:4:0
// ElementaryTypeName#249 (2910:4:0) -> 2755:4:0
// ElementaryTypeNameExpression#252 (2916:4:0) -> 2761:4:0
// ElementaryTypeName#251 (2916:4:0) -> 2761:4:0
// VariableDeclarationStatement#272 (2932:57:0) -> 2777:58:0
// VariableDeclaration#257 (2933:6:0) -> 2778:6:0
// ElementaryTypeName#256 (2933:4:0) -> 2778:4:0
// VariableDeclaration#259 (2941:6:0) -> 2786:6:0
// ElementaryTypeName#258 (2941:4:0) -> 2786:4:0
// FunctionCall#271 (2951:38:0) -> 2796:38:0
// MemberAccess#261 (2951:10:0) -> 2796:10:0
// Identifier#260 (2951:3:0) -> 2796:3:0
// IndexRangeAccess#265 (2962:12:0) -> 2807:12:0
// MemberAccess#263 (2962:8:0) -> 2807:8:0
// Identifier#262 (2962:3:0) -> 2807:3:0
// Literal#264 (2972:1:0) -> 2817:1:0
// TupleExpression#270 (2976:12:0) -> 2821:12:0
// ElementaryTypeNameExpression#267 (2977:4:0) -> 2822:4:0
// ElementaryTypeName#266 (2977:4:0) -> 2822:4:0
// ElementaryTypeNameExpression#269 (2983:4:0) -> 2828:4:0
// ElementaryTypeName#268 (2983:4:0) -> 2828:4:0
// VariableDeclarationStatement#289 (2999:57:0) -> 2844:58:0
// VariableDeclaration#274 (3000:6:0) -> 2845:6:0
// ElementaryTypeName#273 (3000:4:0) -> 2845:4:0
// VariableDeclaration#276 (3008:6:0) -> 2853:6:0
// ElementaryTypeName#275 (3008:4:0) -> 2853:4:0
// FunctionCall#288 (3018:38:0) -> 2863:38:0
// MemberAccess#278 (3018:10:0) -> 2863:10:0
// Identifier#277 (3018:3:0) -> 2863:3:0
// IndexRangeAccess#282 (3029:12:0) -> 2874:12:0
// MemberAccess#280 (3029:8:0) -> 2874:8:0
// Identifier#279 (3029:3:0) -> 2874:3:0
// Literal#281 (3038:1:0) -> 2883:1:0
// TupleExpression#287 (3043:12:0) -> 2888:12:0
// ElementaryTypeNameExpression#284 (3044:4:0) -> 2889:4:0
// ElementaryTypeName#283 (3044:4:0) -> 2889:4:0
// ElementaryTypeNameExpression#286 (3050:4:0) -> 2895:4:0
// ElementaryTypeName#285 (3050:4:0) -> 2895:4:0
// VariableDeclarationStatement#305 (3066:56:0) -> 2911:57:0
// VariableDeclaration#291 (3067:6:0) -> 2912:6:0
// ElementaryTypeName#290 (3067:4:0) -> 2912:4:0
// VariableDeclaration#293 (3075:6:0) -> 2920:6:0
// ElementaryTypeName#292 (3075:4:0) -> 2920:4:0
// FunctionCall#304 (3085:37:0) -> 2930:37:0
// MemberAccess#295 (3085:10:0) -> 2930:10:0
// Identifier#294 (3085:3:0) -> 2930:3:0
// IndexRangeAccess#298 (3096:11:0) -> 2941:11:0
// MemberAccess#297 (3096:8:0) -> 2941:8:0
// Identifier#296 (3096:3:0) -> 2941:3:0
// TupleExpression#303 (3109:12:0) -> 2954:12:0
// ElementaryTypeNameExpression#300 (3110:4:0) -> 2955:4:0
// ElementaryTypeName#299 (3110:4:0) -> 2955:4:0
// ElementaryTypeNameExpression#302 (3116:4:0) -> 2961:4:0
// ElementaryTypeName#301 (3116:4:0) -> 2961:4:0
// VariableDeclarationStatement#320 (3132:53:0) -> 2977:54:0
// VariableDeclaration#307 (3133:6:0) -> 2978:6:0
// ElementaryTypeName#306 (3133:4:0) -> 2978:4:0
// VariableDeclaration#309 (3141:6:0) -> 2986:6:0
// ElementaryTypeName#308 (3141:4:0) -> 2986:4:0
// FunctionCall#319 (3151:34:0) -> 2996:34:0
// MemberAccess#311 (3151:10:0) -> 2996:10:0
// Identifier#310 (3151:3:0) -> 2996:3:0
// MemberAccess#313 (3162:8:0) -> 3007:8:0
// Identifier#312 (3162:3:0) -> 3007:3:0
// TupleExpression#318 (3172:12:0) -> 3017:12:0
// ElementaryTypeNameExpression#315 (3173:4:0) -> 3018:4:0
// ElementaryTypeName#314 (3173:4:0) -> 3018:4:0
// ElementaryTypeNameExpression#317 (3179:4:0) -> 3024:4:0
// ElementaryTypeName#316 (3179:4:0) -> 3024:4:0
// FunctionDefinition#371 (3198:372:0) -> 3043:372:0
// ParameterList#323 (3219:2:0) -> 3064:2:0
// ModifierInvocation#326 (3229:40:0) -> 3074:40:0
// Identifier#324 (3229:13:0) -> 3074:13:0
// Literal#325 (3243:25:0) -> 3088:25:0
// ParameterList#327 (3270:0:0) -> 3114:0:0
// Block#370 (3270:300:0) -> 3115:300:0
// TryStatement#343 (3280:92:0) -> 3125:92:0
// FunctionCall#330 (3284:11:0) -> 3129:11:0
// NewExpression#329 (3284:9:0) -> 3129:9:0
// UserDefinedTypeName#328 (3288:5:0) -> 3133:5:0
// TryCatchClause#336 (3296:34:0) -> 3141:34:0
// Block#335 (3296:34:0) -> 3141:34:0
// VariableDeclarationStatement#334 (3310:9:0) -> 3155:10:0
// VariableDeclaration#332 (3310:5:0) -> 3155:5:0
// ElementaryTypeName#331 (3310:3:0) -> 3155:3:0
// Literal#333 (3318:1:0) -> 3163:1:0
// TryCatchClause#342 (3331:41:0) -> 3176:41:0
// Block#341 (3338:34:0) -> 3183:34:0
// VariableDeclarationStatement#340 (3352:9:0) -> 3197:10:0
// VariableDeclaration#338 (3352:5:0) -> 3197:5:0
// ElementaryTypeName#337 (3352:3:0) -> 3197:3:0
// Literal#339 (3360:1:0) -> 3205:1:0
// TryStatement#369 (3381:183:0) -> 3226:183:0
// FunctionCall#349 (3385:45:0) -> 3230:45:0
// FunctionCallOptions#348 (3385:43:0) -> 3230:43:0
// NewExpression#345 (3385:16:0) -> 3230:16:0
// UserDefinedTypeName#344 (3389:12:0) -> 3234:12:0
// Literal#346 (3408:3:0) -> 3253:3:0
// Literal#347 (3420:7:0) -> 3265:7:0
// TryCatchClause#358 (3431:59:0) -> 3276:59:0
// ParameterList#352 (3439:16:0) -> 3284:16:0
// VariableDeclaration#351 (3440:14:0) -> 3285:14:0
// UserDefinedTypeName#350 (3440:12:0) -> 3285:12:0
// Block#357 (3456:34:0) -> 3301:34:0
// VariableDeclarationStatement#356 (3470:9:0) -> 3315:10:0
// VariableDeclaration#354 (3470:5:0) -> 3315:5:0
// ElementaryTypeName#353 (3470:3:0) -> 3315:3:0
// Literal#355 (3478:1:0) -> 3323:1:0
// TryCatchClause#363 (3491:36:0) -> 3336:36:0
// ParameterList#361 (3502:22:0) -> 3347:22:0
// VariableDeclaration#360 (3503:20:0) -> 3348:20:0
// ElementaryTypeName#359 (3503:6:0) -> 3348:6:0
// Block#362 (3525:2:0) -> 3370:2:0
// TryCatchClause#368 (3528:36:0) -> 3373:36:0
// ParameterList#366 (3534:27:0) -> 3379:27:0
// VariableDeclaration#365 (3535:25:0) -> 3380:25:0
// ElementaryTypeName#364 (3535:5:0) -> 3380:5:0
// Block#367 (3562:2:0) -> 3407:2:0
// FunctionDefinition#389 (3576:119:0) -> 3421:123:0
// ParameterList#372 (3593:2:0) -> 3438:2:0
// ParameterList#373 (3603:0:0) -> 3440:0:0
// Block#388 (3603:92:0) -> 3448:96:0
// ExpressionStatement#380 (3613:34:0) -> 3458:37:0
// FunctionCall#379 (3613:34:0) -> 3458:36:0
// Identifier#374 (3613:6:0) -> 3458:6:0
// TupleExpression#378 (3620:26:0) -> 3465:28:0
// BinaryOperation#377 (3621:24:0) -> 3466:26:0
// Literal#375 (3621:6:0) -> 3467:6:0
// Literal#376 (3631:14:0) -> 3477:14:0
// ExpressionStatement#387 (3657:31:0) -> 3504:34:0
// FunctionCall#386 (3657:31:0) -> 3504:33:0
// Identifier#381 (3657:6:0) -> 3504:6:0
// TupleExpression#385 (3664:23:0) -> 3511:25:0
// BinaryOperation#384 (3665:21:0) -> 3512:23:0
// Literal#382 (3665:6:0) -> 3513:6:0
// Literal#383 (3675:11:0) -> 3523:11:0
// FunctionDefinition#473 (3701:522:0) -> 3550:522:0
// ParameterList#390 (3728:2:0) -> 3577:2:0
// ModifierInvocation#392 (3740:24:0) -> 3589:24:0
// Identifier#391 (3740:22:0) -> 3589:22:0
// ParameterList#395 (3773:6:0) -> 3622:6:0
// VariableDeclaration#394 (3774:4:0) -> 3623:4:0
// ElementaryTypeName#393 (3774:4:0) -> 3623:4:0
// Block#472 (3780:443:0) -> 3629:443:0
// VariableDeclarationStatement#406 (3790:88:0) -> 3639:89:0
// VariableDeclaration#403 (3790:62:0) -> 3639:62:0
// FunctionTypeName#402 (3790:62:0) -> 3639:52:0
// ParameterList#398 (3798:9:0) -> 3647:9:0
// VariableDeclaration#397 (3799:7:0) -> 3648:7:0
// ElementaryTypeName#396 (3799:7:0) -> 3648:7:0
// ParameterList#401 (3825:17:0) -> 3674:17:0
// VariableDeclaration#400 (3826:15:0) -> 3675:15:0
// ElementaryTypeName#399 (3826:15:0) -> 3675:15:0
// MemberAccess#405 (3855:23:0) -> 3704:23:0
// Identifier#404 (3855:10:0) -> 3704:10:0
// VariableDeclarationStatement#413 (3888:58:0) -> 3737:59:0
// VariableDeclaration#410 (3888:28:0) -> 3737:28:0
// FunctionTypeName#409 (3888:28:0) -> 3737:24:0
// ParameterList#407 (3896:2:0) -> 3745:2:0
// ParameterList#408 (3913:0:0) -> 3747:0:0
// MemberAccess#412 (3919:27:0) -> 3768:27:0
// Identifier#411 (3919:10:0) -> 3768:10:0
// VariableDeclarationStatement#424 (3956:34:0) -> 3805:35:0
// VariableDeclaration#418 (3956:18:0) -> 3805:18:0
// ArrayTypeName#417 (3956:6:0) -> 3805:6:0
// ElementaryTypeName#416 (3956:4:0) -> 3805:4:0
// FunctionCall#423 (3977:13:0) -> 3826:13:0
// NewExpression#421 (3977:10:0) -> 3826:10:0
// ArrayTypeName#420 (3981:6:0) -> 3830:6:0
// ElementaryTypeName#419 (3981:4:0) -> 3830:4:0
// Literal#422 (3988:1:0) -> 3837:1:0
// ExpressionStatement#430 (4000:11:0) -> 3849:12:0
// Assignment#429 (4000:11:0) -> 3849:11:0
// IndexAccess#427 (4000:7:0) -> 3849:7:0
// Identifier#425 (4000:4:0) -> 3849:4:0
// Literal#426 (4005:1:0) -> 3854:1:0
// Literal#428 (4010:1:0) -> 3859:1:0
// ExpressionStatement#436 (4021:11:0) -> 3870:12:0
// Assignment#435 (4021:11:0) -> 3870:11:0
// IndexAccess#433 (4021:7:0) -> 3870:7:0
// Identifier#431 (4021:4:0) -> 3870:4:0
// Literal#432 (4026:1:0) -> 3875:1:0
// Literal#434 (4031:1:0) -> 3880:1:0
// ExpressionStatement#442 (4042:11:0) -> 3891:12:0
// Assignment#441 (4042:11:0) -> 3891:11:0
// IndexAccess#439 (4042:7:0) -> 3891:7:0
// Identifier#437 (4042:4:0) -> 3891:4:0
// Literal#438 (4047:1:0) -> 3896:1:0
// Literal#440 (4052:1:0) -> 3901:1:0
// VariableDeclarationStatement#449 (4063:45:0) -> 3912:46:0
// VariableDeclaration#444 (4063:21:0) -> 3912:21:0
// UserDefinedTypeName#443 (4063:12:0) -> 3912:12:0
// FunctionCall#448 (4087:21:0) -> 3936:21:0
// Identifier#445 (4087:12:0) -> 3936:12:0
// Literal#446 (4100:1:0) -> 3949:1:0
// Identifier#447 (4103:4:0) -> 3952:4:0
// VariableDeclarationStatement#457 (4118:21:0) -> 3967:22:0
// VariableDeclaration#454 (4118:15:0) -> 3967:15:0
// ArrayTypeName#453 (4118:6:0) -> 3967:6:0
// ElementaryTypeName#452 (4118:4:0) -> 3967:4:0
// MemberAccess#456 (4136:3:0) -> 3985:3:0
// Identifier#455 (4136:1:0) -> 3985:1:0
// ExpressionStatement#460 (4149:8:0) -> 3998:9:0
// UnaryOperation#459 (4149:8:0) -> 3998:8:0
// Identifier#458 (4156:1:0) -> 4005:1:0
// VariableDeclarationStatement#466 (4167:13:0) -> 4016:14:0
// VariableDeclaration#462 (4167:6:0) -> 4016:6:0
// ElementaryTypeName#461 (4167:4:0) -> 4016:4:0
// IndexAccess#465 (4176:4:0) -> 4025:4:0
// Identifier#463 (4176:1:0) -> 4025:1:0
// Literal#464 (4178:1:0) -> 4027:1:0
// ExpressionStatement#469 (4190:8:0) -> 4039:9:0
// UnaryOperation#468 (4190:8:0) -> 4039:8:0
// Identifier#467 (4197:1:0) -> 4046:1:0
// Return#471 (4208:8:0) -> 4057:9:0
// Identifier#470 (4215:1:0) -> 4064:1:0
// FunctionDefinition#495 (4229:176:0) -> 4078:176:0
// ParameterList#474 (4251:2:0) -> 4100:2:0
// ParameterList#475 (4261:0:0) -> 4102:0:0
// Block#494 (4261:144:0) -> 4110:144:0
// ExpressionStatement#481 (4271:24:0) -> 4120:25:0
// MemberAccess#480 (4271:24:0) -> 4120:24:0
// MemberAccess#479 (4271:15:0) -> 4120:15:0
// Identifier#476 (4271:4:0) -> 4120:4:0
// ExpressionStatement#487 (4305:51:0) -> 4154:52:0
// MemberAccess#486 (4305:51:0) -> 4154:51:0
// MemberAccess#485 (4305:42:0) -> 4154:42:0
// Identifier#482 (4305:13:0) -> 4154:13:0
// ExpressionStatement#493 (4366:32:0) -> 4215:33:0
// MemberAccess#492 (4366:32:0) -> 4215:32:0
// MemberAccess#491 (4366:23:0) -> 4215:23:0
// Identifier#488 (4366:15:0) -> 4215:15:0
// FunctionDefinition#521 (4411:168:0) -> 4260:168:0
// ParameterList#499 (4441:17:0) -> 4290:17:0
// VariableDeclaration#498 (4442:15:0) -> 4291:15:0
// ArrayTypeName#497 (4442:6:0) -> 4291:6:0
// ElementaryTypeName#496 (4442:4:0) -> 4291:4:0
// ParameterList#503 (4476:15:0) -> 4325:15:0
// VariableDeclaration#502 (4477:13:0) -> 4326:13:0
// ArrayTypeName#501 (4477:6:0) -> 4326:6:0
// ElementaryTypeName#500 (4477:4:0) -> 4326:4:0
// Block#520 (4492:87:0) -> 4341:87:0
// ExpressionStatement#507 (4502:8:0) -> 4351:9:0
// Assignment#506 (4502:8:0) -> 4351:8:0
// Identifier#504 (4502:4:0) -> 4351:4:0
// Identifier#505 (4509:1:0) -> 4358:1:0
// VariableDeclarationStatement#513 (4520:16:0) -> 4369:17:0
// VariableDeclaration#512 (4520:16:0) -> 4369:16:0
// ArrayTypeName#511 (4520:6:0) -> 4369:6:0
// ElementaryTypeName#510 (4520:4:0) -> 4369:4:0
// ExpressionStatement#517 (4546:8:0) -> 4395:9:0
// Assignment#516 (4546:8:0) -> 4395:8:0
// Identifier#514 (4546:1:0) -> 4395:1:0
// Identifier#515 (4550:4:0) -> 4399:4:0
// Return#519 (4564:8:0) -> 4413:9:0
// Identifier#518 (4571:1:0) -> 4420:1:0
// FunctionDefinition#525 (4585:29:0) -> 4434:29:0
// ParameterList#522 (4592:2:0) -> 4441:2:0
// ParameterList#523 (4612:0:0) -> 4443:0:0
// Block#524 (4612:2:0) -> 4461:2:0
// FunctionDefinition#529 (4620:22:0) -> 4469:22:0
// ParameterList#526 (4628:2:0) -> 4477:2:0
// ParameterList#527 (4640:0:0) -> 4479:0:0
// Block#528 (4640:2:0) -> 4489:2:0
// ContractDefinition#664 (4646:845:0) -> 4495:863:0
// VariableDeclaration#534 (4709:22:0) -> 4524:56:0
// StructuredDocumentation#531 (4675:29:0) -> 4524:34:0
// ArrayTypeName#533 (4709:6:0) -> 4558:6:0
// ElementaryTypeName#532 (4709:4:0) -> 4558:4:0
// FunctionDefinition#567 (4738:235:0) -> 4587:237:0
// ParameterList#541 (4756:36:0) -> 4605:36:0
// VariableDeclaration#538 (4757:22:0) -> 4606:22:0
// ArrayTypeName#537 (4757:8:0) -> 4606:8:0
// ArrayTypeName#536 (4757:6:0) -> 4606:6:0
// ElementaryTypeName#535 (4757:4:0) -> 4606:4:0
// VariableDeclaration#540 (4781:10:0) -> 4630:10:0
// ElementaryTypeName#539 (4781:4:0) -> 4630:4:0
// ParameterList#545 (4814:17:0) -> 4663:17:0
// VariableDeclaration#544 (4815:15:0) -> 4664:15:0
// ArrayTypeName#543 (4815:6:0) -> 4664:6:0
// ElementaryTypeName#542 (4815:4:0) -> 4664:4:0
// Block#566 (4832:141:0) -> 4681:143:0
// ExpressionStatement#554 (4842:61:0) -> 4691:64:0
// FunctionCall#553 (4842:61:0) -> 4691:63:0
// Identifier#546 (4842:7:0) -> 4691:7:0
// TupleExpression#551 (4850:21:0) -> 4699:23:0
// BinaryOperation#550 (4851:19:0) -> 4700:21:0
// MemberAccess#548 (4851:11:0) -> 4701:11:0
// Identifier#547 (4851:4:0) -> 4701:4:0
// Identifier#549 (4865:5:0) -> 4715:5:0
// Literal#552 (4873:29:0) -> 4724:29:0
// VariableDeclarationStatement#563 (4913:33:0) -> 4764:34:0
// VariableDeclaration#559 (4913:19:0) -> 4764:19:0
// ArrayTypeName#558 (4913:6:0) -> 4764:6:0
// ElementaryTypeName#557 (4913:4:0) -> 4764:4:0
// IndexAccess#562 (4935:11:0) -> 4786:11:0
// Identifier#560 (4935:4:0) -> 4786:4:0
// Identifier#561 (4940:5:0) -> 4791:5:0
// Return#565 (4956:10:0) -> 4807:11:0
// Identifier#564 (4963:3:0) -> 4814:3:0
// FunctionDefinition#612 (4979:228:0) -> 4830:232:0
// ParameterList#572 (4997:24:0) -> 4848:24:0
// VariableDeclaration#571 (4998:22:0) -> 4849:22:0
// ArrayTypeName#570 (4998:8:0) -> 4849:8:0
// ArrayTypeName#569 (4998:6:0) -> 4849:6:0
// ElementaryTypeName#568 (4998:4:0) -> 4849:4:0
// ParameterList#573 (5029:0:0) -> 4872:0:0
// Block#611 (5029:178:0) -> 4880:182:0
// VariableDeclarationStatement#583 (5039:40:0) -> 4890:41:0
// VariableDeclaration#578 (5039:19:0) -> 4890:19:0
// ArrayTypeName#577 (5039:6:0) -> 4890:6:0
// ElementaryTypeName#576 (5039:4:0) -> 4890:4:0
// FunctionCall#582 (5061:18:0) -> 4912:18:0
// Identifier#579 (5061:9:0) -> 4912:9:0
// Identifier#580 (5071:4:0) -> 4922:4:0
// Literal#581 (5077:1:0) -> 4928:1:0
// ExpressionStatement#587 (5089:16:0) -> 4940:17:0
// FunctionCall#586 (5089:16:0) -> 4940:16:0
// Identifier#584 (5089:11:0) -> 4940:11:0
// Identifier#585 (5101:3:0) -> 4952:3:0
// ForStatement#610 (5115:86:0) -> 4966:90:0
// VariableDeclarationStatement#591 (5120:10:0) -> 4971:11:0
// VariableDeclaration#589 (5120:6:0) -> 4971:6:0
// ElementaryTypeName#588 (5120:4:0) -> 4971:4:0
// Literal#590 (5129:1:0) -> 4980:1:0
// TupleExpression#596 (5132:16:0) -> 4983:18:0
// BinaryOperation#595 (5133:14:0) -> 4984:16:0
// Identifier#592 (5133:1:0) -> 4985:1:0
// MemberAccess#594 (5137:10:0) -> 4989:10:0
// Identifier#593 (5137:3:0) -> 4989:3:0
// ExpressionStatement#600 (5150:5:0) -> 4965:8:0
// TupleExpression#599 (5150:5:0) -> 4965:7:0
// UnaryOperation#598 (5151:3:0) -> 4966:5:0
// Identifier#597 (5151:1:0) -> 4967:1:0
// Block#609 (5157:44:0) -> 5012:44:0
// ExpressionStatement#608 (5171:19:0) -> 5026:20:0
// FunctionCall#607 (5171:19:0) -> 5026:19:0
// MemberAccess#603 (5171:11:0) -> 5026:11:0
// Identifier#601 (5171:6:0) -> 5026:6:0
// IndexAccess#606 (5183:6:0) -> 5038:6:0
// Identifier#604 (5183:3:0) -> 5038:3:0
// Identifier#605 (5187:1:0) -> 5042:1:0
// FunctionDefinition#663 (5213:276:0) -> 5068:288:0
// ParameterList#616 (5233:27:0) -> 5088:27:0
// VariableDeclaration#615 (5234:25:0) -> 5089:25:0
// ArrayTypeName#614 (5234:6:0) -> 5089:6:0
// ElementaryTypeName#613 (5234:4:0) -> 5089:4:0
// ParameterList#617 (5275:0:0) -> 5115:0:0
// Block#662 (5275:214:0) -> 5130:226:0
// ForStatement#661 (5285:198:0) -> 5140:210:0
// VariableDeclarationStatement#621 (5290:10:0) -> 5145:11:0
// VariableDeclaration#619 (5290:6:0) -> 5145:6:0
// ElementaryTypeName#618 (5290:4:0) -> 5145:4:0
// Literal#620 (5299:1:0) -> 5154:1:0
// TupleExpression#626 (5302:22:0) -> 5157:24:0
// BinaryOperation#625 (5303:20:0) -> 5158:22:0
// Identifier#622 (5303:1:0) -> 5159:1:0
// MemberAccess#624 (5307:16:0) -> 5163:16:0
// Identifier#623 (5307:9:0) -> 5163:9:0
// ExpressionStatement#630 (5326:5:0) -> 5139:8:0
// TupleExpression#629 (5326:5:0) -> 5139:7:0
// UnaryOperation#628 (5327:3:0) -> 5140:5:0
// Identifier#627 (5327:1:0) -> 5141:1:0
// Block#660 (5333:150:0) -> 5192:158:0
// ForStatement#659 (5347:126:0) -> 5206:134:0
// VariableDeclarationStatement#637 (5352:16:0) -> 5211:19:0
// VariableDeclaration#632 (5352:6:0) -> 5211:6:0
// ElementaryTypeName#631 (5352:4:0) -> 5211:4:0
// TupleExpression#636 (5361:7:0) -> 5220:9:0
// BinaryOperation#635 (5362:5:0) -> 5221:7:0
// Identifier#633 (5362:1:0) -> 5222:1:0
// Literal#634 (5366:1:0) -> 5226:1:0
// TupleExpression#642 (5370:22:0) -> 5231:24:0
// BinaryOperation#641 (5371:20:0) -> 5232:22:0
// Identifier#638 (5371:1:0) -> 5233:1:0
// MemberAccess#640 (5375:16:0) -> 5237:16:0
// Identifier#639 (5375:9:0) -> 5237:9:0
// ExpressionStatement#646 (5394:5:0) -> 5205:8:0
// TupleExpression#645 (5394:5:0) -> 5205:7:0
// UnaryOperation#644 (5395:3:0) -> 5206:5:0
// Identifier#643 (5395:1:0) -> 5207:1:0
// Block#658 (5401:72:0) -> 5266:74:0
// ExpressionStatement#657 (5419:39:0) -> 5284:42:0
// FunctionCall#656 (5419:39:0) -> 5284:41:0
// Identifier#647 (5419:7:0) -> 5284:7:0
// TupleExpression#655 (5427:30:0) -> 5292:32:0
// BinaryOperation#654 (5428:28:0) -> 5293:30:0
// IndexAccess#650 (5428:12:0) -> 5294:12:0
// Identifier#648 (5428:9:0) -> 5294:9:0
// Identifier#649 (5438:1:0) -> 5304:1:0
// IndexAccess#653 (5444:12:0) -> 5310:12:0
// Identifier#651 (5444:9:0) -> 5310:9:0
// Identifier#652 (5454:1:0) -> 5320:1:0
// ContractDefinition#670 (5493:88:0) -> 5360:88:0
// FunctionDefinition#669 (5523:56:0) -> 5390:56:0
// ParameterList#665 (5536:2:0) -> 5403:2:0
// ParameterList#668 (5561:17:0) -> 5428:17:0
// VariableDeclaration#667 (5562:15:0) -> 5429:15:0
// ElementaryTypeName#666 (5562:15:0) -> 5429:15:0
// ContractDefinition#681 (5583:179:0) -> 5450:178:0
// InheritanceSpecifier#672 (5613:13:0) -> 5480:13:0
// UserDefinedTypeName#671 (5613:13:0) -> 5480:13:0
// VariableDeclaration#680 (5698:61:0) -> 5500:125:0
// StructuredDocumentation#673 (5633:60:0) -> 5500:64:0
// ElementaryTypeName#674 (5698:15:0) -> 5564:15:0
// OverrideSpecifier#675 (5731:8:0) -> 5597:8:0
// FunctionCall#679 (5747:12:0) -> 5613:12:0
// ElementaryTypeNameExpression#677 (5747:7:0) -> 5613:7:0
// ElementaryTypeName#676 (5747:7:0) -> 5613:7:0
// Literal#678 (5755:3:0) -> 5621:3:0
