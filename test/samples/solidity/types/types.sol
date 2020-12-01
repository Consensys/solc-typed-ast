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

    function (uint) internal returns (int) fn;
}
