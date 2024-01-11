// ------------------------------------------------------------
// test/samples/solidity/struct_docs_04.sol
// ------------------------------------------------------------
pragma solidity 0.4.24;

contract StmtDocs04 {
    /// Enum
    /// Docstring
    enum EnumXYZ {
        X,
        Y,
        Z
        /// Dangling
        /// Docstring
    }

    event Ev(uint a);

    /// Struct
    /// Docstring
    struct StructABC {
        uint a;
        /// Dangling
        /// Docstring
    }

    modifier modStructDocs() {
        /// PlaceholderStatement docstring
        _;
    }

    function stmtStructDocs() public modStructDocs() {
        /// VariableDeclarationStatement docstring
        uint a = (1);
        /// ExpressionStatement docstring
        1;
        /// Block docstring
        {}
        /// EmitStatement docstring
        emit Ev(1);
        /// WhileStatement docstring
        while (false) /// Body Block docstring
        {
            /// Continue docstring
            continue;
        }
        /// DoWhileStatement docstring
        do {
            /// Break docstring
            break;
        } while(true);
        /// ForStatement docstring
        for (/// Init VariableDeclarationStatement docstring
        uint n = (1); n < 1; /// Post-loop ExpressionStatement docstring
        n++) /// Body Block docstring
        {}
        /// IfStatement docstring
        if (false) /// True body Block docstring
        {} else /// False body Block docstring
        {}
        /// InlineAssembly docstring
        assembly {
}
        return;
    }
}
