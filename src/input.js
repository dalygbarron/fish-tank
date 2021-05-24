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
 * UI buttons that all input handling subsystems have to handle (but they can
 * be mapped into your control scheme however you want).
 * @readonly
 * @enum {string}
 */
fish.input.UI_BUTTON = {
    /** move up in menus etc */
    UP: 'UP',
    /** move down in menus etc */
    DOWN: 'DOWN',
    /** move left in menus etc */
    LEFT: 'LEFT',
    /** move right in menus etc */
    RIGHT: 'RIGHT',
    /** accept dialogs and things */
    ACCEPT: 'ACCEPT',
    /** go back and cancel things etc */
    CANCEL: 'CANCEL'
};

/**
 * Basic ui operations required by the engine for an input system.
 * @interface
 */
fish.input.UiInput = class {
    /**
     * Tells you if the given ui button is currently down.
     * @param {fish.input.UI_BUTTON} button is the button to check on.
     * @return {boolean} true iff it is down.
     */
    uiDown(button) {
        throw new Error('fish.input.UiInput.uiDown must be implemented');
    }

    /**
     * Tells you if the given ui button just went down.
     * @param {fish.input.UI_BUTTON} button is the button to check on.
     * @return {boolean} true iff it is down.
     */
    uiJustDown(button) {
        throw new Error('fish.input.UiInput.uiJustDown must be implemented');
    }

    /**
     * Gives you the compatability level of the input system.
     * @return {fish.Compatability} compatability report.
     */
    getCompatability() {
        throw new Error(
            'fish.input.UiInput.getCompatability must be implemented'
        );
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
fish.input.BasicInput = function (keymap={}, threshold=0.9) {
    /**
     * The buttons that this imaginary controller provides.
     * @readonly
     * @enum {string}
     */
    this.BUTTON = {
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
    for (let button in this.BUTTON) {
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
     * Converts a ui button to an actual button on this controller thing.
     * @param {string} uiCode is the code to convert.
     * @return {string} the corresponding actual button.
     */
    let uiToButton = uiCode => {
        switch (uiCode) {
            case fish.input.UI_BUTTON.UP: return this.BUTTON.UP;
            case fish.input.UI_BUTTON.DOWN: return this.BUTTON.DOWN;
            case fish.input.UI_BUTTON.LEFT: return this.BUTTON.LEFT;
            case fish.input.UI_BUTTON.RIGHT: return this.BUTTON.RIGHT;
            case fish.input.UI_BUTTON.ACCEPT: return this.BUTTON.A;
            case fish.input.UI_BUTTON.CANCEL: return this.BUTTON.B;
        }
        throw uiCode;
    };

    /**
     * Just iterates the frame number.
     */
    this.update = () => {
        frame++;
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (let button in this.BUTTON) {
            updateButton(button, keys[keymap[button]]);
        }
        for (let pad of gamepads) {
            updateButton(this.BUTTON.A, pressed(pad.buttons[0]), true);
            updateButton(this.BUTTON.B, pressed(pad.buttons[1]), true);
            updateButton(this.BUTTON.X, pressed(pad.buttons[2]), true);
            updateButton(this.BUTTON.Y, pressed(pad.buttons[3]), true);
            updateButton(this.BUTTON.L, pressed(pad.buttons[4]), true);
            updateButton(this.BUTTON.R, pressed(pad.buttons[5]), true);
            updateButton(this.BUTTON.SELECT, pressed(pad.buttons[8]), true);
            updateButton(this.BUTTON.START, pressed(pad.buttons[9]), true);
            updateButton(
                this.BUTTON.UP,
                pressed(pad.buttons[12]) || pad.axes[1] < -threshold,
                true
            );
            updateButton(
                this.BUTTON.DOWN,
                pressed(pad.buttons[13]) || pad.axes[1] > threshold,
                true
            );
            updateButton(
                this.BUTTON.LEFT,
                pressed(pad.buttons[14]) || pad.axes[0] < -threshold,
                true
            );
            updateButton(
                this.BUTTON.RIGHT,
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
    this.down = code => {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] > 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param {string} code is the code to represent or whatever.
     * @return {boolean} true if it was pressed this frame.
     */
    this.justDown = code => {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] == frame;
    };

    /** @inheritDoc */
    this.uiDown = uiCode => {
        return this.down(uiToButton(uiCode));
    };

    /** @inheritDoc */
    this.uiJustDown = uiCode => {
        return this.justDown(uiToButton(uiCode));
    };

    /** @inheritDoc */
    this.getCompatability = () => {
        return new fish.Compatability(fish.COMPATABILITY_LEVEL.FULL, 'all g');
    };
};
