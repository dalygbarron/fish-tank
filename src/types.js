class Colour {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    /**
     * Wraps this vector destructively in a rectangle that starts at (0, 0)
     * then goes to bounds.
     * @param bounds is a vector representing the far corner.
     */
    wrap(bounds) {
        this.x = (this.x < 0) ? (bounds.x - Math.abs(this.x % bounds.x)) :
            (this.x % bounds.x);
        this.y = (this.y < 0) ? (bounds.y - Math.abs(this.y % bounds.y)) :
            (this.y % bounds.y);
    }
}

class Rect {
    constructor(x, y, w, h) {
        this.pos = new Vector(x, y);
        this.size = new Vector(w, h);
    }

    get x() {
        return this.pos.x;
    }

    get y() {
        return this.pos.y;
    }

    get w() {
        return this.size.x;
    }

    get h() {
        return this.size.y;
    }

    get r() {
        return this.pos.x + this.size.x;
    }

    get b() {
        return this.pos.y + this.size.y;
    }
}

/**
 * Represents a texture from opengl but also holds it's width and height.
 */
class Texture {
    /**
     * Creates the texture.
     * @param glTexture is the actual texture inside.
     * @param width     is the width of the texture.
     * @param height    is the height of the texture.
     */
    constructor(glTexture, width, height) {
        this.glTexture = glTexture;
        this.width = width;
        this.height = height;
    }
}

/**
 * Asynchronously loads a texture out of a url. I made it asynchronous because
 * returning a test image would work quite poorly with texture atlases, and it
 * will also fuck up with other data types so we need to implement asynchronous
 * loading.
 * @param gl  is the opengl context for doing texture stuff.
 * @param url is the url to load the texture from.
 * @return the texture.
 */
async function loadTexture(gl, url) {
    return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            resolve(new Texture(texture, image.width, image.height));
        };
        image.onerror = () => {
            reject(`failed loading image '${url}'`);
        };
        image.src = url;
    });
}
