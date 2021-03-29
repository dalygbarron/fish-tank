let fish = fish || {};
let fish.graphics = {};

/**
 * Represents a colour with parts from 0 to 1.
 * @param r is the red part.
 * @param g is the green part.
 * @param b is the blue part.
 * @param a is the transparancy part.
 */
fish.graphics.Colour = (r, g, b, a) => {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};

/**
 * Creates a texture object out of a gl texture.
 * @param glTexture is the open gl reference to the texture.
 * @param width     is the width of the texture.
 * @param height    is the height of the texture.
 */
fish.graphics.Texture = (glTexture, width, height) => {
    /**
     * Gives you the opengl texture.
     * @return the opengl reference to the texture.
     */
    this.getGlTexture = () => {
        return glTexture;
    };

    /**
     * Gives you the width of the texture.
     * @return the width.
     */
    this.getWidth = () => {
        return width;
    }

    /**
     * Gives you the height of the texture.
     * @return the height.
     */
    this.getHeight = () => {
        return height;
    };
};

/**
 * Stores sprites.
 */
fish.graphics.Atlas = () => {
    let sprites = {};

    /**
     * Adds a sprite into the atlas.
     * @param name   is the name of the atlas.
     * @param sprite is the sprite to add.
     */
    this.add = (name, sprite) => {
        sprites[name] = sprite;
    };

    /**
     * Gets a sprite out of the atlas.
     * @param name is the name of the sprite to get.
     * @return the sprite found or an empty one if it lacks it.
     */
    this.get = (name) => {
        if (name in this.sprites) return this.sprites[name];
        console.error(`unknown sprite name ${name}`);
        return new fish.util.Rect(0, 0, 0, 0);
    };

    /**
     * Iterates over all sprites in the atlas.
     * @param callback is a callback to run for each one.
     */
    this.forEach = (callback) => {
        for (let sprite in this.sprites) {
            callback(sprite, this.sprites[sprite]);
        }
    };
};

/**
 * Asynchronously loads a texture out of a url. I made it asynchronous because
 * returning a test image would work quite poorly with texture atlases, and it
 * will also fuck up with other data types so we need to implement asynchronous
 * loading.
 * @param gl  is the opengl context for doing texture stuff.
 * @param url is the url to load the texture from.
 * @return the texture.
 */
fish.graphics.loadTexture = (gl, url) => {
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
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );
            resolve(new fish.graphics.Texture(
                texture,
                image.width,
                image.height
            ));
        };
        image.onerror = () => {
            reject(`failed loading image '${url}'`);
        };
        image.src = url;
    });
}

/**
 * Loads in the data part of a texture atlas.
 * @param url is the url to load it from.
 * @return the created atlas. I dunno what happens if you fuck it up but
 *         probably something bad.
 */
async function loadAtlas(url) {
    let text = await loadText(url);
    let data = JSON.parse(text);
    let atlas = new Atlas();
    for (let frame in data.frames) {
        let rect = data.frames[frame].frame;
        atlas.add(frame, new Rect(rect.x, rect.y, rect.w, rect.h));
    }
    return atlas;
}
