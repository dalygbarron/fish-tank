var fish = fish || {};

/**
 * Contains the base input handler and a couple of button constants that are
 * required to be handled by the gui system. If you create your input handler
 * you just need to make sure you implement uiDown and uiJustDown so that it
 * will work with the gui system.
 * @namespace
 */
fish.input = {};

/**
 * The buttons that this imaginary controller provides.
 * @readonly
 * @enum {string}
 */
fish.input.BUTTON = {
    /** Left axis on controller pointed up. */
    UP: 'UP',
    /** Left axis on controller pointed down. */
    DOWN: 'DOWN',
    /** Left axis on controller pointed left. */
    LEFT: 'LEFT',
    /** Left axis on controller pointed right. */
    RIGHT: 'RIGHT',
    /** X button like on xbox controller. */
    X: 'X',
    /** Y button like on xbox controller. */
    Y: 'Y',
    /** A button like on xbox controller. */
    A: 'A',
    /** B button like on xbox controller. */
    B: 'B',
    /** left trigger button. */
    L: 'L',
    /** right trigger button. */
    R: 'R',
    /** left menu button. */
    SELECT: 'SELECT',
    /** right menu button thing. Generally the pause button. */
    START: 'START'
};

/**
 * Error representing when something that is not in fish.input.BUTTON is
 * attempted to be used as an input code.
 */
fish.input.CodeError = class extends Error {
    /**
     * @param {string} code is the incorrect key code.
     */
    constructor(code) {
        super(`${code} is not a valid input code`);
    }
};

/**
 * An input handler system that unifies all input from gamepads / keyboard
 * into one abstract input which is supposed to work like a gamepad basically.
 * It only works with 1 player games for that reason.
 * @constructor
 * @implements {fish.input.UiInput}
 * @param {Object.<string, string>} [keymap={}] a mapping from html key names
 *        to button on the virtual controller.
 * @param {number} [threshold=0.9] the threshold beyond which a gamepad axis is
 *        considered pressed.
 */
fish.input.InputHandler = function (keymap={}, threshold=0.9) {
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
    let buttonStates = {};
    for (let button in fish.input.BUTTON) {
        buttonStates[button] = 0;
    }
    document.addEventListener('keydown', (e) => {keys[e.key] = true;});
    document.addEventListener('keyup', (e) => {keys[e.key] = false;});

    /**
     * Tells you if the given button is pressed whether it is a number or
     * a button object thing.
     * @param {string|number} button is either a number or a button object thingo.
     * @return {boolean} true iff it is pressed.
     */
    let pressed = button => {
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
     * @param {boolean} include is whether to keep the value that is already
     *        there.
     */
    let updateButton = (button, value, include=false) => {
        if (include) value = value || buttonStates[button] > 0;
        if (!value) buttonStates[button] = 0;
        else if (buttonStates[button] == 0) buttonStates[button] = frame;
    };

    /**
     * Just iterates the frame number.
     */
    this.update = () => {
        frame++;
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (let button in fish.input.BUTTON) {
            updateButton(button, keys[keymap[button]]);
        }
        for (let pad of gamepads) {
            if (!pad) continue;
            updateButton(fish.input.BUTTON.A, pressed(pad.buttons[0]), true);
            updateButton(fish.input.BUTTON.B, pressed(pad.buttons[1]), true);
            updateButton(fish.input.BUTTON.X, pressed(pad.buttons[2]), true);
            updateButton(fish.input.BUTTON.Y, pressed(pad.buttons[3]), true);
            updateButton(fish.input.BUTTON.L, pressed(pad.buttons[4]), true);
            updateButton(fish.input.BUTTON.R, pressed(pad.buttons[5]), true);
            updateButton(
                fish.input.BUTTON.SELECT,
                pressed(pad.buttons[8]),
                true
            );
            updateButton(
                fish.input.BUTTON.START,
                pressed(pad.buttons[9]),
                true
            );
            updateButton(
                fish.input.BUTTON.UP,
                pressed(pad.buttons[12]) || pad.axes[1] < -threshold,
                true
            );
            updateButton(
                fish.input.BUTTON.DOWN,
                pressed(pad.buttons[13]) || pad.axes[1] > threshold,
                true
            );
            updateButton(
                fish.input.BUTTON.LEFT,
                pressed(pad.buttons[14]) || pad.axes[0] < -threshold,
                true
            );
            updateButton(
                fish.input.BUTTON.RIGHT,
                pressed(pad.buttons[15]) || pad.axes[0] > threshold,
                true
            );
        }
    };

    /**
     * Tells you if the given input is pressed.
     * @param {fish.input.BUTTON} code represents the iinput button thing.
     * @return {boolean} true if it is pressed.
     */
    this.down = code => {
        if (!(code in buttonStates)) throw new fish.input.CodeError(code);
        return buttonStates[code] > 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param {fish.input.BUTTON} code is the code to represent or whatever.
     * @return {boolean} true if it was pressed this frame.
     */
    this.justDown = code => {
        if (!(code in buttonStates)) throw new fish.input.CodeError(code);
        return buttonStates[code] == frame;
    };

    /**
     * Converts a button code to a ascii symbol for it.
     * @param {fish.input.BUTTON} code is the code to convert.
     * @return {number} the character code.
     */
    this.asciiCode = code => {
        switch (code) {
            case fish.input.BUTTON.UP: return 0xf0;
            case fish.input.BUTTON.DOWN: return 0xf1;
            case fish.input.BUTTON.LEFT: return 0xf2;
            case fish.input.BUTTON.RIGHT: return 0xf3;
            case fish.input.BUTTON.Y: return 0xf4;
            case fish.input.BUTTON.A: return 0xf5;
            case fish.input.BUTTON.X: return 0xf6;
            case fish.input.BUTTON.B: return 0xf7;
            case fish.input.BUTTON.SELECT: return 0xf8;
            case fish.input.BUTTON.START: return 0xf9;
        }
        throw new fish.input.CodeError(code);
    };

    /**
     * Gives you a user readable name for a given input thingy code based on
     * the keymap.
     * @param {fish.input.BUTTON} code is the input to name.
     * @return {string} a readable name for both keyboard and gamepad.
     */
    this.nameCode = code => {
        let ascii = String.fromCharCode(this.asciiCode(code));
        return `${keymap[code]} / ${ascii}`;
    };
};
