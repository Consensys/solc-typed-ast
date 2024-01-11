    /// X
        /// Y
            /// Z
contract /** random */ Test /** garbage */ {
    /// A
        // B
    /// C
    modifier mA() { _; }


    /// A

    modifier mB() { _; }

    /**
     * A
     */
    /**
     * B
     */
    modifier mC() { _; }

    /// A
    /// B
    modifier mD() { _; }

    /// A
    /**
     * B
     */
    modifier mE() { _; }

    // /// A
    modifier mF() { _; }

    /*
     * /// A
     */
    modifier mG() { _; }

    /// A
        // B
    /// C
    uint vA;

    /// A

    uint vB;

    /**
     * A
     */
    /**
     * B
     */
    uint vC;

    /// A
    /// B
    uint vD;

    /// A
    /**
     * B
     */
    uint vE;

    // /// A
    uint vF;

    /*
     * /// A
     */
    uint vG;

    /// A
        // B
    /// C
    function fA() external {}


    /// A

    function fB() external {}

    /**
     * A
     */
    /**
     * B
     */
    function fC() external {}

    /// A
    /// B
    function fD() external {}

    /// A
    /**
     * B
     */
    function fE() external {}

    // /// A
    function fF() external {}

    /*
     * /// A
     */
    function fG() external {
        uint x;
        if /** silly */ ( (x = 1) < 0) /** goose */ {
            /** comment */
        }

        for /** haha"" 'asdfsad' */ (
            /** this is a docstring */ x = 0 ;
            x > 0;
            /* fml /// "asd" */)
            /** this is also a docstring  */ {

        }
    }
}
