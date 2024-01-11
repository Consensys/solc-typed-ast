// ------------------------------------------------------------
// test/samples/solidity/struct_docs_05.sol
// ------------------------------------------------------------
pragma solidity 0.5.17;

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
        /// Modifier dangling docstring
    }

    function stmtStructDocs() public modStructDocs() {
        /// VariableDeclarationStatement docstring
        uint a = (1);
        /// ExpressionStatement docstring
        1;
        /// Block docstring
        {
            /// Block dangling docstring
        }
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
            /// Do-While
            ///  Dangling
            ///   Docstring
        } while(true);
        /// ForStatement docstring
        for (/// Init VariableDeclarationStatement docstring
        uint n = (1); n < 1; /// Post-loop ExpressionStatement docstring
        n++) /// Body Block docstring
        {}
        /// IfStatement docstring
        if (false) /// True body Block docstring
        {
            /// True body dangling docstring
        } else /// False body Block docstring
        {
            /// False body dangling docstring
        }
        /// InlineAssembly docstring
        assembly { }
        /// Return docstring
        return;
        /// Function body docstring
    }
    /// Dangling
    /// Docstring
}
