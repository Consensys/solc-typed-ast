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
// SourceUnit#31 (0:207:0) -> 0:206:0
// PragmaDirective#1 (0:22:0) -> 0:22:0
// ContractDefinition#30 (24:182:0) -> 24:182:0
// VariableDeclaration#4 (44:19:0) -> 44:19:0
// ElementaryTypeName#2 (44:4:0) -> 44:4:0
// Literal#3 (62:1:0) -> 62:1:0
// FunctionDefinition#29 (70:134:0) -> 70:134:0
// ParameterList#5 (83:2:0) -> 83:2:0
// ParameterList#6 (93:0:0) -> 85:0:0
// Block#28 (93:111:0) -> 93:111:0
// VariableDeclarationStatement#10 (103:10:0) -> 103:10:0
// VariableDeclaration#8 (103:6:0) -> 103:6:0
// ElementaryTypeName#7 (103:4:0) -> 103:4:0
// Literal#9 (112:1:0) -> 112:1:0
// ExpressionStatement#14 (123:5:0) -> 123:5:0
// Assignment#13 (123:5:0) -> 123:5:0
// Identifier#11 (123:1:0) -> 123:1:0
// Literal#12 (127:1:0) -> 127:1:0
// Block#19 (138:30:0) -> 138:30:0
// ExpressionStatement#18 (152:5:0) -> 152:5:0
// Assignment#17 (152:5:0) -> 152:5:0
// Identifier#15 (152:1:0) -> 152:1:0
// Literal#16 (156:1:0) -> 156:1:0
// ExpressionStatement#23 (177:5:0) -> 177:5:0
// Assignment#22 (177:5:0) -> 177:5:0
// Identifier#20 (177:1:0) -> 177:1:0
// Literal#21 (181:1:0) -> 181:1:0
// ExpressionStatement#27 (192:5:0) -> 192:5:0
// Assignment#26 (192:5:0) -> 192:5:0
// Identifier#24 (192:1:0) -> 192:1:0
// Literal#25 (196:1:0) -> 196:1:0
