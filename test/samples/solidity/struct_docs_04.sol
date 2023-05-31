pragma solidity 0.4.24;

contract StmtDocs04 {
    event Ev(uint a);

    /// Struct
        /// Docstring
    struct StructABC {
        uint a;

        /// Struct

        /// Dangling
        /// Docstring
    }

    /// Enum
        /// Docstring
    enum EnumXYZ {
        X, Y, Z

        /// Enum

        /// Dangling
        /// Docstring
    }

    modifier modStructDocs() {
        /// PlaceholderStatement docstring
        _;
    }

    function stmtStructDocs() modStructDocs() public {
        /// VariableDeclarationStatement docstring
        (uint a) = (1);

        /// ExpressionStatement docstring
        1;

        /// Block docstring
        {}

        /// EmitStatement docstring
        emit Ev(1);

        /// WhileStatement docstring
        while(false)
        /// Body Block docstring
        {
            /// Continue docstring
            continue;
        }

        /// DoWhileStatement docstring
        do
        /// Body Block docstring
        {
            /// Break docstring
            break;
        }
        while(true);

        /// ForStatement docstring
        for (
            /// Init VariableDeclarationStatement docstring
            (uint n) = (1);
            /// Expression docstring
            n < 1;
            /// Post-loop ExpressionStatement docstring
            n++
        ) 
        /// Body Block docstring
        {}

        /// IfStatement docstring
        if (false)
        /// True body Block docstring
        {}
        else
        /// False body Block docstring
        {}

        /// InlineAssembly docstring
        assembly {}


        /// Return docstring
        return;
    }
}

