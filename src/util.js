var fish = fish || {};
fish.util = {};

/**
 * Represents a two dimensional point / direction via cartesian coordinates.
 * @param x is the horizontal part.
 * @param y is the vector part.
 */
fish.util.Vector = function (x, y) {
    this.x = x;
    this.y = y;

    /**
     * Adds another vector to this vector, modifying this one.
     * @param other is the other vector.
     */
    this.add = (other) => {
        this.x += other.x;
        this.y += other.y;
    };

    /**
     * Wraps this vector in a rectangle that starts at (0, 0) then goes to
     * bounds.
     * @param bounds is a vector representing the far corner.
     */
    this.wrap = (bounds) => {
        this.x = (this.x < 0) ? (bounds.x - Math.abs(this.x % bounds.x)) :
            (this.x % bounds.x);
        this.y = (this.y < 0) ? (bounds.y - Math.abs(this.y % bounds.y)) :
            (this.y % bounds.y);
    };
};

/**
 * Represents an axis aligned rectangle.
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
 * @param url is the url to load the file from.
 * @return a promise that resolves to the loaded file.
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
