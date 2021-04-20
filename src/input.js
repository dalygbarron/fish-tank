var fish = fish || {};

fish.Input = function (threshold = 0.9) {
    let frame = 0;
    let keyStates = {
        UP: 0,
        DOWN: 0,
        LEFT: 0,
        RIGHT: 0,
        X: 0,
        Y: 0,
        A: 0,
        B: 0,
        L: 0,
        R: 0,
        SELECT: 0,
        START: 0
    };
    this.UP = 'UP';
    this.DOWN = 'DOWN';
    this.LEFT = 'LEFT';
    this.RIGHT = 'RIGHT';
    this.X = 'X';
    this.Y = 'Y';
    this.A = 'A';
    this.B = 'B';
    this.L = 'L';
    this.R = 'R';
    this.SELECT = 'SELECT';
    this.START = 'START';

    /**
     * Tells you if the given button is pressed whether it is a number or
     * a button object thing.
     * @param button is either a number or a button object thingo.
     * @return true iff it is pressed.
     */
    let pressed = function (button) {
        if (typeof(button) == 'object') {
            return button.pressed;
        }
        return button == 1.0;
    };

    /**
     * Just iterates the frame number.
     */
    this.update = function () {
        frame++;
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (let pad of gamepads) {
            keyStates[this.A] = pressed(pad.buttons[0]) ? frame : 0;
            keyStates[this.B] = pressed(pad.buttons[1]) ? frame : 0;
            keyStates[this.X] = pressed(pad.buttons[2]) ? frame : 0;
            keyStates[this.Y] = pressed(pad.buttons[3]) ? frame : 0;
            keyStates[this.L] = pressed(pad.buttons[4]) ? frame : 0;
            keyStates[this.R] = pressed(pad.buttons[5]) ? frame : 0;
            keyStates[this.SELECT] = pressed(pad.buttons[8]) ? frame : 0;
            keyStates[this.START] = pressed(pad.buttons[9]) ? frame : 0;
            keyStates[this.UP] = pressed(pad.buttons[12]) ? frame :
                pad.axes[1] < -threshold;
            keyStates[this.DOWN] = pressed(pad.buttons[13]) ? frame :
                pad.axes[1] > threshold;
            keyStates[this.LEFT] = pressed(pad.buttons[14]) ? frame :
                pad.axes[0] < -threshold;
            keyStates[this.RIGHT] = pressed(pad.buttons[15]) ? frame :
                pad.axes[0] > threshold;
        }
    };

    /**
     * Tells you if the given input is pressed.
     * @param code represents the iinput button thing.
     * @return true if it is pressed.
     */
    this.down = function (code) {
        if (!(code in keyStates)) {
            throw code;
        }
        return keyStates[code] > 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param code is the code to represent or whatever.
     * @return true if it was pressed this frame.
     */
    this.justDown = function (code) {
        if (!(code in keyStates)) {
            throw code;
        }
        return keyStates[code] == frame;
    };
};
