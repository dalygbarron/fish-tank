import * as util from './util';

// TODO: I ought to implement gamepad support here, but for the time
//       being I am just trying to implement it in such a way that it
//       shouldn't be hard to add it.

const AXIS_THRESHOLD = 0.1;
const BUTTON_THRESHOLD = 0.7;

export enum Buttons {
    X = 'a',
    Y = 's',
    A = 'z',
    B = 'x',
    L = 'shift',
    R = 'ctrl',
    SELECT = 'backspace',
    START = 'enter',
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight'
}

export enum Axes {
    HORIZONTAL,
    VERTICAL
}

let enabled = false;

let keys: {[code: string]: number} = {};
for (const key in Buttons) keys[Buttons[key]] = 0;
console.log(keys);

const onKeyDown = e => {
    if (e.key in keys) keys[e.key] = 1;
}

const onKeyUp = e => {
    if (e.key in keys) keys[e.key] = 0;
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

/**
 * Updates the input handler and gets the current state of things.
 */
export function update() {
    // TODO: yeah so here we need to combine the information we poll from the
    //       gamepads with whatever info we have already got from the keyboard.
}

/**
 * Poll the state of the given button.
 * @param button is the button to poll.
 * @returns true if the button is pressed and false if not.
 */
export function getButton(button: string): boolean {
    // TODO: handle gamepad.
    return keys[Buttons[button]] > BUTTON_THRESHOLD;
}

/**
 * Gets the state of the given axis.
 * @param axis axis to check.
 * @returns a number between -1 and 1 inclusive.
 */
export function getAxis(neg: string, pos: string): number {
    const negative = keys[Buttons[neg]];
    const positive = keys[Buttons[pos]];
    return (Math.abs(positive) > AXIS_THRESHOLD ? positive : 0) -
        (Math.abs(negative) > AXIS_THRESHOLD ? negative : 0)
}