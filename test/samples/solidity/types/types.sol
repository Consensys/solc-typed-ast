contract TestStorage {
    uint storeduint1 = 15;
    uint constant constuint = 16;
    uint32 investmentsDeadlineTimeStamp = uint32(now);

    bytes16 string1 = "test1";
    bytes32 private string2 = "test1236";
    string public string3 = "lets string something";

    mapping (address => uint) public uints1;
    mapping (address => DeviceData) structs1;

    struct DeviceData {
        string deviceBrand;
        string deviceYear;
        string batteryWearLevel;
    }

    uint[] uintarray;
    DeviceData[] deviceDataArray;

    mapping(address => uint) public balances;
    mapping(address => mapping(uint => bool)) public map1;

    function (uint) internal returns (int) fn;

    function id(uint x) internal returns (uint) { return x; }

    function main() public {
        balances;
        map1;

        mapping(address => uint) storage l1 = balances;
        mapping(address => mapping(uint => bool)) storage l2 = map1;

        l1;
        l2;

        byte b;
        b;

        function (uint) returns (uint) x = id;

        x;

        uint[4] memory t;

        t;
    }
}
