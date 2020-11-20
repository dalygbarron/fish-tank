/**
 * Creates an object representing a colour. The numbers should be between 0 and
 * 1, unless you are doing somethign freaky I guess.
 * @param r is red.
 * @param g is green.
 * @param b is blue.
 * @param a is alpha.
 * @return the colour object.
 */
function createColour(r, g, b, a) {
    return {r: r, g: g, b: b, a: a};
}

/**
 * Creates a rectangle.
 * @param x is the left position.
 * @param y is the top position.
 * @param w is the width.
 * @param h is the height.
 * @return the rect object.
 */
function createRect(x, y, w, h) {
    return {x: x, y: y, w: w, h: h};
}

/**
 * Tells you if the given number is a power of two.
 * @param n is the number to check.
 * @return true iff n is a power of two.
 */
function isPowerOfTwo(n) {
    return Math.floor(n / 2) == n / 2;
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
            resolve(texture);
        };
        image.src = url;
    });
}
