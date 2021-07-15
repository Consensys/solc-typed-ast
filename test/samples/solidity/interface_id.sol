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
