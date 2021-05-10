var fish = fish || {};

/**
 * Provides some basic utility stuff. Maths classes and whatever the hell ya
 * know.
 * @namespace
 */
fish.util = {};

/**
 * Represents a two dimensional point / direction via cartesian coordinates.
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
     * Adds another vector or value to this vector and returns the result
     * without changing this object.
     * @param {fish.util.Vector|number} other is the one to add.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.plus = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x + other.x, this.y + other.y) :
            new fish.util.Vector(this.x + other, this.y + other);
    };

    /**
     * Subtracts another vector or value from this vector and returns the
     * result without changing this object.
     * @param {fish.util.Vector|number} other is the one to subtract.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.minus = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x - other.x, this.y - other.y) :
            new fish.util.Vector(this.x - other, this.y - other);
    };

    /**
     * Multiplies another vector or value with this vector and returns the
     * result without changing this object.
     * @param {fish.util.Vector|number} other is the one to multiply.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.times = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x - other.x, this.y - other.y) :
            new fish.util.Vector(this.x - other, this.y - other);
    };

    /**
     * Adds another vector onto this one component wise.
     * @param {fish.util.Vector} other is the other vector.
     */
    this.add = other => {
        this.x += other.x;
        this.y += other.y;
    };

    /**
     * Wraps this vector in a rectangle that starts at (0, 0) then goes to
     * bounds.
     * @param {fish.util.Vector} bounds is a vector representing the far
     *                           corner.
     */
    this.wrap = (bounds) => {
        this.x = (this.x < 0) ? (bounds.x - Math.abs(this.x % bounds.x)) :
            (this.x % bounds.x);
        this.y = (this.y < 0) ? (bounds.y - Math.abs(this.y % bounds.y)) :
            (this.y % bounds.y);
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
fish.util.loadText = async function (url) {
    return await new Promise((resolve, reject) => {
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
    let fitted = '';
    let lines = text.split(/\n\n+/);
    for (let line of lines) {
        let offset = 0;
        let tokens = bit.split(/\s/);
        for (let token of tokens) {
            if (token.length == 0) continue;
            let size = (token.length - 1) * font.getHorizontalPadding();
            for (let i = 0; i < token.length; i++) {
                size += font.getWidth(token.charAt(i));
            }
            if (size > width) {
                fitted += `\n${token}`;
                offset = size;
            } else {
                fitted += token;
                offset += size;
            }
            offset += font.getWidth(' ');
            fitted += ' ';
        }
    }
    return fitted;
};

/**
 * This is a rect that you can use for stuff when you don't want to instantiate
 * one. Just know that in between uses it's value could be arbitrary.
 */
fish.util.aRect = new fish.util.Rect();
