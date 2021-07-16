interface ERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface ERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface ERC1363 is ERC20, ERC165 {
    function transferAndCall(address recipient, uint256 amount) external returns (bool);
    function transferAndCall(address recipient, uint256 amount, bytes calldata data) external returns (bool);
    function transferFromAndCall(address sender, address recipient, uint256 amount) external returns (bool);
    function transferFromAndCall(address sender, address recipient, uint256 amount, bytes calldata data) external returns (bool);
    function approveAndCall(address spender, uint256 amount) external returns (bool);
    function approveAndCall(address spender, uint256 amount, bytes calldata data) external returns (bool);
}

interface ISome {
    function sum(uint256 a, uint256 b) pure external returns (uint256);
}

abstract contract Some is ISome {
    function sub(uint256 a, uint256 b) pure external returns (uint256) {
        return a - b;
    }

    function mul(uint256 a, uint256 b) virtual pure external returns (uint256);
}

abstract contract Other {
    uint public x;

    constructor(uint a) {
        x = a;
    }

    fallback() external {}
    receive() external payable {}
}

interface Empty {}
