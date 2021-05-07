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
 * @param {number} x is the horizontal part.
 * @param {number} y is the vector part.
 */
fish.util.Vector = function (x, y) {
    this.x = x;
    this.y = y;

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
     * Adds another vector to this vector, modifying this one.
     * @param {fish.util.Vector|number} other is the other value or vector.
     */
    this.add = other => {
        let thingy = this.plus(other);
        this.x = thingy.x;
        this.y = thingy.y;
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

// TODO: might be useful to have an immutable vector class that wraps around an
// existing vector but only gives you an immutable view of it. hmmm or it would
// be a big wank for no reason.

/**
 * Represents an axis aligned rectangle and it should be immutable I think.
 * wait no. But I should make it immutable maybe.
 */
fish.util.Rect = class {
    /**
     * Creates the rectangle.
     * @param x is the horizontal position of the rectangle.
     * @param y is the vertical position of the rectangle.
     * @param w is the width of the rectangle.
     * @param h is the height of the rectangle.
     */
    constructor(x, y, w, h) {
        this.pos = new fish.util.Vector(x, y);
        this.size = new fish.util.Vector(w, h);
    }

    /**
     * Gets the horizontal position of the rectangle.
     * @return x
     */
    get x() {
        return this.pos.x;
    }

    /**
     * Gets the vertical position of the rectangle.
     * @return y.
     */
    get y() {
        return this.pos.y;
    }

    /**
     * Gets the width of the rectangle.
     * @return w.
     */
    get w() {
        return this.size.x;
    }

    /**
     * Gets the height of the rectangle.
     * @return h.
     */
    get h() {
        return this.size.y;
    }

    /**
     * Gets the position of the right hand side of the rectangle.
     * @return x + w
     */
    get r() {
        return this.pos.x + this.size.x;
    }

    /**
     * Gets the position of the bottom of the rectangle.
     * @return y + h
     */
    get b() {
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
