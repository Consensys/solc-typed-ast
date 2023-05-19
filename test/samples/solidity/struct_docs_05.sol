pragma solidity 0.5.17;

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
        _; /// Modifier dangling docstring
    }

    function stmtStructDocs() modStructDocs() public {
        /// VariableDeclarationStatement docstring
        (uint a) = (1);

        /// ExpressionStatement docstring
        1;

        /// Block docstring
        {
            /// Block dangling docstring
        }

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

            /// Do-While
            ///  Dangling
            ///   Docstring
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
        { /// True body dangling docstring
        }
        else
        /// False body Block docstring
        { /**False body dangling docstring*/ }

        /// InlineAssembly docstring
        assembly {}

        /// Return docstring
        return;

        /**
         * Function body docstring
         */
    }

    /// Contract

    /// Dangling
    /// Docstring
}
