var fish = fish || {};

/**
 * Contains the base input handler and a couple of button constants that are
 * required to be handled by the gui system. If you create your input handler
 * you just need to make sure you implement uiDown and uiJustDown so that it
 * will work with the gui system.
 * @namespace
 */
fish.input = {};

/** @constant */
fish.input.UI_UP = 'UI_UP';

/** @constant */
fish.input.UI_DOWN = 'UI_DOWN';

/** @constant */
fish.input.UI_LEFT = 'UI_LEFT';

/** @constant */
fish.input.UI_RIGHT = 'UI_RIGHT';

/** @constant */
fish.input.UI_ACCEPT = 'UI_ACCEPT';

/** @constant */
fish.input.UI_CANCEL = 'UI_CANCEL';

/**
 * An input handler that unifies all input from gamepads / keyboard into one
 * abstract input which is supposed to work like a gamepad basically. It only
 * works with 1 player games for that reason.
 * @constructor
 * @param {Object.<string, string>} keymap is a mapping from html key names to
 *                                         button on the virtual controller.
 * @param {number}                         is the threshold beyond which a
 *                                         gamepad axis is considered pressed.
 */
fish.input.BasicInput = function (keymap={}, threshold = 0.9) {
    if (!keymap.UP) keymap.UP = 'ArrowUp';
    if (!keymap.DOWN) keymap.DOWN = 'ArrowDown';
    if (!keymap.LEFT) keymap.LEFT = 'ArrowLeft';
    if (!keymap.RIGHT) keymap.RIGHT = 'ArrowRight';
    if (!keymap.A) keymap.A = 'Shift';
    if (!keymap.B) keymap.B = 'z';
    if (!keymap.X) keymap.X = 'a';
    if (!keymap.Y) keymap.Y = 'x';
    if (!keymap.L) keymap.L = 'd';
    if (!keymap.R) keymap.R = 'c';
    if (!keymap.SELECT) keymap.SELECT = 'Escape';
    if (!keymap.START) keymap.START = 'Enter';
    let frame = 0;
    let keys = {};
    let buttonStates = {
        UP: false,
        DOWN: false,
        LEFT: false,
        RIGHT: false,
        X: false,
        Y: false,
        A: false,
        B: false,
        L: false,
        R: false,
        SELECT: false,
        START: false
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
    document.addEventListener('keydown', (e) => {keys[e.key] = true;});
    document.addEventListener('keyup', (e) => {keys[e.key] = false;});

    /**
     * Tells you if the given button is pressed whether it is a number or
     * a button object thing.
     * @param {string} button is either a number or a button object thingo.
     * @return {boolean} true iff it is pressed.
     */
    let pressed = function (button) {
        if (typeof(button) == 'object') {
            return button.pressed;
        }
        return button == 1.0;
    };

    /**
     * Sets a button to the correct value based on whether it is pressed or not
     * rn.
     * @param {string}  button is the button to update.
     * @param {boolean} value  is whether or not it is pressed right now.
     */
    let updateButton = function (button, value, include=false) {
        if (include) value = value || buttonStates[button] > 0;
        if (!value) buttonStates[button] = 0;
        else if (buttonStates[button] == 0) buttonStates[button] = frame;
    };

    /**
     * Converts a ui button to an actual button on this controller thing.
     * @param {string} uiCode is the code to convert.
     * @return {string} the corresponding actual button.
     */
    let uiToButton = (uiCode) => {
        switch (uiCode) {
            case fish.input.UI_UP: return this.UP;
            case fish.input.UI_DOWN: return this.DOWN;
            case fish.input.UI_LEFT: return this.LEFT;
            case fish.input.UI_RIGHT: return this.RIGHT;
            case fish.input.UI_ACCEPT: return this.A;
            case fish.input.UI_CANCEL: return this.B;
        }
        return null;
    };

    /**
     * Just iterates the frame number.
     */
    this.update = function () {
        frame++;
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        updateButton(this.A, keys[keymap.A]);
        updateButton(this.B, keys[keymap.B]);
        updateButton(this.X, keys[keymap.X]);
        updateButton(this.Y, keys[keymap.Y]);
        updateButton(this.L, keys[keymap.L]);
        updateButton(this.R, keys[keymap.R]);
        updateButton(this.SELECT, keys[keymap.SELECT]);
        updateButton(this.START, keys[keymap.START]);
        updateButton(this.UP, keys[keymap.UP]);
        updateButton(this.DOWN, keys[keymap.DOWN]);
        updateButton(this.LEFT, keys[keymap.LEFT]);
        updateButton(this.RIGHT, keys[keymap.RIGHT]);
        for (let pad of gamepads) {
            updateButton(this.A, pressed(pad.buttons[0]), true);
            updateButton(this.B, pressed(pad.buttons[1]), true);
            updateButton(this.X, pressed(pad.buttons[2]), true);
            updateButton(this.Y, pressed(pad.buttons[3]), true);
            updateButton(this.L, pressed(pad.buttons[4]), true);
            updateButton(this.R, pressed(pad.buttons[5]), true);
            updateButton(this.SELECT, pressed(pad.buttons[8]), true);
            updateButton(this.START, pressed(pad.buttons[9]), true);
            updateButton(
                this.UP,
                pressed(pad.buttons[12]) || pad.axes[1] < -threshold,
                true
            );
            updateButton(
                this.DOWN,
                pressed(pad.buttons[13]) || pad.axes[1] > threshold,
                true
            );
            updateButton(
                this.LEFT,
                pressed(pad.buttons[14]) || pad.axes[0] < -threshold,
                true
            );
            updateButton(
                this.RIGHT,
                pressed(pad.buttons[15]) || pad.axes[0] > threshold,
                true
            );
        }
    };

    /**
     * Tells you if the given input is pressed.
     * @param {string} code represents the iinput button thing.
     * @return {boolean} true if it is pressed.
     */
    this.down = function (code) {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] > 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param {string} code is the code to represent or whatever.
     * @return {boolean} true if it was pressed this frame.
     */
    this.justDown = function (code) {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] == frame;
    };

    /**
     * Tells you if the given ui button is down.
     * @param {string} uiCode is the ui button in question.
     * @return {boolean} true if it is down now.
     */
    this.uiDown = (uiCode) => {
        return this.down(uiToButton(uiCode));
    };

    /**
     * Tells you if the given ui button just went down last frame.
     * @param {string} uiCode is the ui button in question.
     * @return {boolean} true if it just went down.
     */
    this.uiJustDown = (uiCode) => {
        return this.justDown(uiToButton(uiCode));
    };
};
