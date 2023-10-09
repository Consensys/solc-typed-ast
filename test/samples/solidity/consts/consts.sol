import "./lib_a.sol";
import "./lib_a.sol" as LibA;

uint constant SOME_CONST = 100;
uint constant SOME_OTHER = 15;
uint constant SOME_ELSE = SOME_CONST + SOME_OTHER;
uint constant C2 = SOME_ELSE + ANOTHER_CONST;
uint constant C3 = SOME_ELSE + LibA.ANOTHER_CONST;
uint constant C4 = -SOME_CONST;
bool constant C5 = false;
uint constant C6 = C5 ? SOME_ELSE : C3;
uint constant C7 = LibA.ANOTHER_CONST + LibB.AND_ANOTHER_CONST;
// uint constant C8 = LibA.ANOTHER_CONST + LibA.LibB.AND_ANOTHER_CONST;

string constant FOO = "abcd";
bytes constant BOO = bytes("abcd");
bytes1 constant MOO = BOO[0];
string constant WOO = string(BOO);

uint16 constant U16S = uint16(bytes2("xy"));
uint16 constant U16B = uint16(bytes2(hex"7879"));
bytes2 constant B2U = bytes2(0x0102);

bytes4 constant NON_UTF8_SEQ = "\x75\x32\xea\xac";
