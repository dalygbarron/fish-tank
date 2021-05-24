var fish = fish || {};

/**
 * Provides some basic utility stuff. Maths classes and whatever the hell ya
 * know.
 * @namespace
 */
fish.util = {};

/**
 * Wraps a number between another number and zero. Like modulus but it actually
 * does what you want it to.
 * @param {number} x is the number to wrap.
 * @param {number} max is the point at which it wraps.
 * @return {number} the result.
 */
fish.util.wrap = (x, max) => {
    return (x < 0) ? max - Math.abs(x % max) : x % max;
};

/**
 * Represents a two dimensional point / direction via cartesian coordinates.
 * You will notice there is no functional style stuff and that is because it
 * requires instantiating objects and in the kinds of contexts where a vector
 * class is most used, that is not really acceptable so yeah.
 * @constructor
 * @param {number} [x=0] is the horizontal part.
 * @param {number} [y=0] is the vector part.
 */
fish.util.Vector = function (x=0, y=0) {
    this.x = x;
    this.y = y;

    /**
     * Sets both parts of the vector to new values.
     * @param {number} [x=0] is the new x part.
     * @param {number} [y=0] is the new y part.
     */
    this.set = (x=0, y=0) => {
        this.x = x;
        this.y = y;
    };

    /**
     * Adds another vector onto this one component wise.
     * @param {fish.util.Vector} other is the other vector.
     * @param {number} [mag=1] is the amount to multiply the other one by
     *        first. I know it's not really that relevant to adding but it is
     *        the main use case so I might as well make it efficient and easy.
     */
    this.add = (other, mag=1) => {
        this.x += other.x * mag;
        this.y += other.y * mag;
    };

    /**
     * Wraps this vector in a rectangle that starts at (0, 0) then goes to
     * bounds.
     * @param {fish.util.Vector} bounds is a vector representing the far
     *                           corner.
     */
    this.wrap = bounds => {
        this.x = fish.util.wrap(this.x, bounds.x);
        this.y = fish.util.wrap(this.y, bounds.y);
    };
};

/**
 * Represents an axis aligned rectangle and it should be immutable I think.
 * wait no. But I should make it immutable maybe.
 */
fish.util.Rect = class {
    /**
     * Creates the rectangle.
     * @param {number} [x=0] is the horizontal position of the rectangle.
     * @param {number} [y=0] is the vertical position of the rectangle.
     * @param {number} [w=0] is the width of the rectangle.
     * @param {number} [h=0] is the height of the rectangle.
     */
    constructor(x=0, y=0, w=0, h=0) {
        this.pos = new fish.util.Vector(x, y);
        this.size = new fish.util.Vector(w, h);
    }

    copy() {
        return new fish.util.Rect(this.x, this.y, this.w, this.h);
    }

    /**
     * Shrinks the rectangle by a certain amount from each of it's former
     * border lines.
     * @param {number} amount the amount to shrink it from each side.
     */
    shrink(amount) {
        this.pos.x += amount;
        this.pos.y += amount;
        this.size.x -= amount * 2;
        this.size.y -= amount * 2;
    }

    /**
     * Gets the horizontal position of the rectangle.
     * @return {number} x
     */
    get x() {
        return this.pos.x;
    }

    /**
     * Gets the vertical position of the rectangle.
     * @return {number} y
     */
    get y() {
        return this.pos.y;
    }

    /**
     * Gets the width of the rectangle.
     * @return {number} w
     */
    get w() {
        return this.size.x;
    }

    /**
     * Gets the height of the rectangle.
     * @return {number} h
     */
    get h() {
        return this.size.y;
    }

    /**
     * Gets the position of the right hand side of the rectangle. Or left
     * depending on how you look at it. Essentially it's x + w.
     * @return {number} x + w
     */
    get r() {
        return this.pos.x + this.size.x;
    }

    /**
     * Gets the position of the top of the rectangle. Or bottom depending on
     * how you are thinking about it. Point is it's y + h.
     * @return {number} y + h
     */
    get t() {
        return this.pos.y + this.size.y;
    }
};

/**
 * Asynchronously loads a text file in.
 * @param {string} url is the url to load the file from.
 * @return {Promise<string>} that resolves to the loaded file content.
 */
fish.util.loadText = function (url) {
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
};

/**
 * Takes a piece of text and fits it so that when drawn with a given font it
 * will fit into a given width space. It ignores single newlines, and turns two
 * or more newlines in a row into a single newline.
 * @param {string} text the text to fit.
 * @param {fish.graphics.Font} font the font to give size to the text.
 * @param {number} width the width to fit the text into.
 */
fish.util.fitText = (text, font, width) => {
    console.log(width);
    let fitted = '';
    let lines = text.split(/\n\n+/);
    for (let line of lines) {
        let offset = 0;
        let tokens = line.split(/\s/);
        for (let token of tokens) {
            if (token.length == 0) continue;
            let size = (token.length - 1) * font.getHorizontalPadding();
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
fish.util.textHeight = (text, font) => {
    let lines = text.split(/\n(?=\S+)/).length;
    return lines * font.getLineHeight() +
        (lines - 1) * font.getVerticalPadding();
};

/**
 * Converts a base64 string to an arraybuffer which is useful for converting
 * into data stuff with browser apis.
 * @param {string} base64 is the base64 string to convert.
 * @return {Uint8Array} created arraybuffer.
 */
fish.util.base64ToArrayBuffer = base64 => {
    let binary = atob(base64);
    let bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

/**
 * Waits for the given amount of time asynchronously.
 * @param {number} time time to wait in seconds.
 * @return {Promise<mixed>} nothing in particular.
 */
fish.util.wait = function (time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
};
