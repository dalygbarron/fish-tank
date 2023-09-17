/**
 * Represents a 2 dimensional vector real nice.
 */
export class Vector2 {
    x: number;
    y: number;

    /**
     * Creates the vector.
     * @param x horizontal parameter.
     * @param y vertical parameter.
     */
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Sets both parts of the vector in one call.
     * @param x value to give x component.
     * @param y value to give y component.
     */
    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
};

/**
 * Represents a 2 dimensional rectangle.
 */
export class Rect {
    x: number;
    y: number;
    w: number;
    h: number;

    /**
     * Creates the rectangle.
     * @param x distance from left.
     * @param y distance from bottom.
     * @param w width.
     * @param h height.
     */
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    /**
     * Tells you the distance of the right side of the rect from the vertical
     * origin.
     * @returns right side.
     */
    r(): number {
        return this.x + this.w;
    }

    /**
     * Tells you the distance of the top side of the rect from the horizontal
     * origin.
     * @returns top side.
     */
    t(): number {
        return this.y + this.h;
    }

    /**
     * Creates an inverted version of the rectangle. Inverted rectangles
     * shouldn't break most things but they might break some stuff idk.
     * @param verticalAxis whether to flip on the vertical axis.
     * @param horizontalAxis whether to flip on the horizontal axis.
     * @returns flipped version of rect.
     */
    flipped(verticalAxis: boolean, horizontalAxis: boolean): Rect {
        return new Rect(
            this.x + (verticalAxis ? this.w : 0),
            this.y + (horizontalAxis ? this.h : 0),
            verticalAxis ? this.w : -this.w,
            horizontalAxis ? this.h : -this.h
        );
    }
}

/**
 * Creates a rect with the dimensions of the screen with corner at 0, 0.
 * @param gl rendering context to get dimensions from.
 * @returns the rectangle.
 */
export function getScreenRect(gl: WebGLRenderingContext): Rect {
    return new Rect(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

/**
 * Wraps a number between [0, max). Like modulus if it wasn't fucking annoying
 * with negative numbers.
 * @param x is the number to wrap.
 * @param max is the point where it wraps.
 * @returns wrapped version.
 */
export function wrap(x: number, max: number): number {
    return (x < 0) ? max - Math.abs(x % max) : x % max;
}

/**
 * Loads some text from some url.
 * @param url is where to load the text from.
 * @returns a promise that resolves to the loaded text.
 */
export function loadText(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) resolve(this.responseText);
                else reject(
                    `couldn't get file '${url}', response code ${this.status}`
                );
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    });
}

/**
 * Takes a piece of text and fits it so that when drawn with a given font it
 * will fit into a given width space. It ignores single newlines, and turns two
 * or more newlines in a row into a single newline.
 * @param {string} text the text to fit.
 * @param {fish.graphics.Font} font the font to give size to the text.
 * @param {number} width the width to fit the text into.
 */
export function fitText(text, font, width) {
    // TODO: needs to handle non monospaced fonts now.
    let fitted = '';
    const lines = text.split(/\n\n+/);
    for (let line of lines) {
        let offset = 0;
        const tokens = line.split(/\s/);
        for (let token of tokens) {
            if (token.length == 0) continue;
            let size = 0;
            for (let i = 0; i < token.length; i++) {
                size += font.getWidth(token.charAt(i));
            }
            if (offset + size > width) {
                fitted += `\n${token}`;
                offset = size;
            } else {
                fitted += token;
                offset += size;
            }
            offset += font.getWidth(' ');
            fitted += ' ';
        }
        fitted += '\n';
    }
    return fitted;
};

/**
 * Takes a fitted piece of text and tells you how high it is gonna be in the
 * given font.
 * @param {string} text is text where every newline is taken seriously.
 * @param {fish.graphics.Font} font is the font used to measure it.
 * @return {number} the number of pixels high it will be.
 */
export function textHeight(text, font) {
    // TODO: this won't work anymore.
    const lines = text.split(/\n(?=\S+)/).length;
    return lines * font.getLineHeight();
};

/**
 * Converts a string containing base64 encoded data into an array of bytes.
 * @param base64 base64 string to convert.
 * @returns byte array of parsed data.
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * Waits for a given time then returns.
 * @param time seconds to wait.
 */
export async function wait(time: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, time * 1000));
}

/**
 * Super class for types that need to be initialised before they can be used.
 */
export class Initialised {
    protected initialised = false;

    /**
     * Check if the object has been initialised yet.
     * @returns true iff the object is ready to roll.
     */
    ready(): boolean {
        return this.initialised;
    }
}