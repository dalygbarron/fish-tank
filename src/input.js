var fish = fish || {};

fish.Input = function () {
    this.TYPE = {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
        X: 'x',
        Y: 'y',
        A: 'a',
        B: 'b',
        L: 'l',
        R: 'r',
        SELECT: 'select',
        START: 'start'
    };
    let frame = 0;
    let keyStates = {};
    for (type of this.TYPE) keyStates[type] = 0;
    window.addEventListener('gamepadconnected', (e) => {
        
    });


    /**
     * Just iterates the frame number.
     */
    this.update = function () {
        frame++;
    };

    /**
     * Tells you if the given input is pressed.
     * @param code represents the iinput button thing.
     * @return true if it is pressed.
     */
    this.pressed = function (code) {
        if (!(code in this.TYPE)) {
            throw 'retard';
        }
        return this.TYPE[code] >= 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param code is the code to represent or whatever.
     * @return true if it was pressed this frame.
     */
    this.justPressed = function (code) {
        if (!(code in this.TYPE)) {
            throw 'retard';
        }
        return this.TYPE[code] == frame;
    };
};
