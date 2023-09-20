import * as util from './util';

// TODO: So basically we need to keep a store of relevant keypresses, and then
//       we need a function that can convert some virtual buttons to the
//       relevant keyboard keys and also the relevant gamepad buttons. Only
//       extra bit of complexity is that gamepads can have axes as well as
//       buttons. I think a good way to do this might be to store the button
//       indices as binary numbers and add a special byte

const AXIS_THRESHOLD = 0.4;
const BUTTON_THRESHOLD = 0.5;

/**
 * Stores the state of a given button or axis.
 */
export class InputState {
    value: number = 0;
    delta: number = 0;

    /**
     * Updates the state value and the delta between the new value and the
     * current.
     * @param value the new value, which will be clamped between -1 and 1.
     */
    update(value: number): void {
        if (value < -1) value = -1;
        if (value > 1) value = 1;
        this.delta = value - this.value;
        this.value = value;
    }

    /**
     * If this is a button it tells you if it is currently pressed.
     * @returns true iff it is pressed.
     */
    pressed(): boolean {
        return this.value > BUTTON_THRESHOLD;
    }

    /**
     * Tells you if this button was just pressed since last frame.
     * @returns true iff it was just pressed.
     */
    justPressed(): boolean {
        return this.value >= BUTTON_THRESHOLD && this.delta >= BUTTON_THRESHOLD;
    }
}

export enum Inputs {
    A = 'z',
    B = 'x',
    X = 'a',
    Y = 's',
    L = 'Shift',
    R = 'Ctrl',
    SELECT = 'Escape',
    START = 'Enter',
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
    HORIZONTAL = 'HORIZONTAL_AXIS',
    VERTICAL = 'VERTICAL_AXIS'
}

const AXES: {[id: string]: string[]} = {
    [Inputs.HORIZONTAL]: [Inputs.LEFT, Inputs.RIGHT],
    [Inputs.VERTICAL]: [Inputs.DOWN, Inputs.UP]
};

const INPUTS_TO_BUTTONS: {[id: string]: number|number[]} = {
    [Inputs.A]: 0,
    [Inputs.B]: 1,
    [Inputs.X]: 2,
    [Inputs.Y]: 3,
    [Inputs.L]: 4,
    [Inputs.R]: 5,
    [Inputs.SELECT]: 8,
    [Inputs.START]: 9,
    [Inputs.UP]: 12,
    [Inputs.DOWN]: 13,
    [Inputs.LEFT]: 14,
    [Inputs.RIGHT]: 15,
    [Inputs.HORIZONTAL]: [14, 15, 0],
    [Inputs.VERTICAL]: [13, 12, -1]
}

const gamepads: Gamepad[] = [];
const keyboard: {[id: string]: boolean} = {};
const status: {[id: string]: InputState} = {};
for (const input in INPUTS_TO_BUTTONS) {
    keyboard[input] = false;
    status[input] = new InputState();
}

const onGamepadConnected = (e: GamepadEvent) => {
    gamepads.push(e.gamepad);
}

const onGamepadDisconnected = (e: GamepadEvent) => {
    const index = gamepads.indexOf(e.gamepad);
    if (index > -1) gamepads.splice(index, 1);
}

 const onKeyDown = (e: KeyboardEvent) => {
    if (e.key in keyboard) keyboard[e.key] = true;
 }

const onKeyUp = (e: KeyboardEvent) => {
    if (e.key in keyboard) keyboard[e.key] = false;
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('gamepadconnected', onGamepadConnected);
window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

/**
 * Updates the input handler and gets the current state of things.
 */
export function update() {
    const gamepad = gamepads.length > 0 ? gamepads[0] : null;
    for (const key in status) {
        let value;
        const buttons = INPUTS_TO_BUTTONS[key];
        if (Array.isArray(buttons)) {
            const keys = AXES[key];
            value = (keyboard[keys[0]] ? -1 : 0 ) + (keyboard[keys[1]] ? 1 : 0);
            if (gamepad) {
                let axisMultiplier = 1;
                let axis = buttons[2];
                if (axis < 0) {
                    axisMultiplier = -1;
                    axis *= -1;
                }
                value += -gamepad.buttons[buttons[0]].value +
                    gamepad.buttons[buttons[1]].value +
                    gamepad.axes[axis] * axisMultiplier;
            }
        } else {
            value = keyboard[key] ? 1 : 0;
            if (gamepad) value += gamepad.buttons[buttons].value
        }
        status[key].update(value);
    }
}

/**
 * Poll the state of the given button.
 * @param button is the button to poll.
 * @returns true if the button is pressed and false if not.
 */
export function getButton(button: string): InputState {
    if (button in status) {
        return status[button];
    }
    console.error(`polling nonexistent button ${button}`);
    return status[Inputs.A];
}