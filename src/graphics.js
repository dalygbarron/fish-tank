/**
 * This file provides functionality for doing graphics stuff. A lot of it is
 * made publically accessible so that if you don't like the SpriteRenderer
 * class for rendering, you can create your own class and use as much existing
 * functionality as possible to save you some time and potentially make
 * different rendering classes as interoperable as practical.
 * So, unless you want to make your own rendering class, probably the only
 * thing you are going to use from this file is SpriteRenderer.
 */

var fish = fish || {};
fish.graphics = {};

/**
 * Creates a texture object out of a gl texture. You probably don't want to
 * instantiate one of these directly unless you are creating your own graphics
 * system.
 * @param glTexture is the open gl reference to the texture.
 * @param width     is the width of the texture.
 * @param height    is the height of the texture.
 */
fish.graphics.Texture = function (glTexture, width, height) {
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
    };

    /**
     * Gives you the height of the texture.
     * @return the height.
     */
    this.getHeight = () => {
        return height;
    };
};

/**
 * Stores sprites. You probably don't want to instantiate one of these directly
 * unless you are creating your own graphics system.
 */
fish.graphics.Atlas = function () {
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
     * Tells you the number of sprites.
     * @return the number of sprites.
     */
    this.n = () => {
        return Object.keys(sprites).length;
    };

    /**
     * Iterates over all sprites in the atlas.
     * @param callback is a callback to run for each one.
     */
    this.forEach = callback => {
        for (let sprite in sprites) callback(sprite, sprites[sprite]);
    };
};

/**
 * Represents a colour with parts from 0 to 1.
 * @param r is the red part.
 * @param g is the green part.
 * @param b is the blue part.
 * @param a is the transparancy part.
 */
fish.graphics.Colour = function (r=1, g=1, b=1, a=1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};

/**
 * Asynchronously loads a texture out of a url. This function requires you to
 * pass a gl context so you probably want to use the version built into the
 * renderer unless you are making your own graphics system.
 * @param url is the url to load the texture from.
 * @return a promise which should never reject but might resolve to null if
 *         it couldn't get it's hands on the texture.
 */
fish.graphics.loadTexture = async function (gl, url) {
    return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
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
            reject(`failed loading image ${url}`);
        };
        image.src = url;
    });
};

/**
 * Loads in the data part of a texture atlas.
 * @param url is the url to load it from.
 * @return the created atlas or null if it couldn't load the text or
 *         something.
 */
this.loadAtlas = async function (url) {
    let text = await fish.util.loadText(url);
    if (text == null) return null;
    let data = JSON.parse(text);
    let atlas = new Atlas();
    for (let frame in data) {
        let rect = data[frame];
        atlas.add(
            frame,
            new fish.util.Rect(rect.x, rect.y, rect.w, rect.h)
        );
    }
    return atlas;
};

/**
 * The default graphics handler which uses a sprite batch to draw nice
 * pictures.
 * @param gl is the opengl context.
 */
fish.graphics.SpriteRenderer = function (gl) {
    let usedTextures = [];
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.width = gl.canvas.clientWidth;
    this.height = gl.canvas.clientHeight;

    /**
     * A thing that batches draw calls.
     * @param texture is the texture all the draws must be from.
     * @param max     is the max things to draw in one go.
     */
    this.Batch = function (texture, max) {
        let items = new Float32Array(max * 12);
        let textureItems = new Float32Array(max * 12);
        let n = 0;
        let rendered = false;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, items, gl.DYNAMIC_DRAW);
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textureItems, gl.DYNAMIC_DRAW);

        /**
         * Adds a thingy to draw.
         * @param src is the source rectangle on the batch texture.
         * @param dst is where to draw it on the screen.
         */
        this.add = (src, dst) => {
            if (n >= max) return;
            const offset = n * 12;
            items[offset] = dst.x;
            items[offset + 1] = dst.y;
            items[offset + 2] = dst.r;
            items[offset + 3] = dst.y;
            items[offset + 4] = dst.x;
            items[offset + 5] = dst.b;
            items[offset + 6] = dst.r;
            items[offset + 7] = dst.y;
            items[offset + 8] = dst.r;
            items[offset + 9] = dst.b;
            items[offset + 10] = dst.x;
            items[offset + 11] = dst.b;
            textureItems[offset] = src.x;
            textureItems[offset + 1] = src.b;
            textureItems[offset + 2] = src.r;
            textureItems[offset + 3] = src.b;
            textureItems[offset + 4] = src.x;
            textureItems[offset + 5] = src.y;
            textureItems[offset + 6] = src.r;
            textureItems[offset + 7] = src.b;
            textureItems[offset + 8] = src.r;
            textureItems[offset + 9] = src.y;
            textureItems[offset + 10] = src.x;
            textureItems[offset + 11] = src.y;
            n++;
        };

        /**
         * Blanks the contents of the batch to go again.
         */
        this.clear = () => {
            rendered = false;
            n = 0;
        };

        /**
         * Renders what the batch currently has to the screen.
         */
        this.render = () => {
            if (rendered) {
                console.error('repeat batch rendering without clear');
                return;
            }
            rendered = true;
            let shader = fish.shader.bindDefaultShader(gl);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, items);
            gl.vertexAttribPointer(shader.position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, textureItems);
            gl.vertexAttribPointer(
                shader.textureCoord,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );
            gl.enableVertexAttribArray(shader.textureCoord);
            // TODO: decide active texture better.
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture.getGlTexture());
            gl.uniform1i(shader.sampler, 0);
            gl.uniform2f(
                shader.invTextureSize,
                1 / texture.getWidth(),
                1 / texture.getHeight()
            );
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
        };
    };

    /**
     * Loads a texture using this graphics thing's gl context.
     * @param url is the url of the texture to load.
     * @return the texture if it worked.
     */
    this.loadTexture = async function (url) {
        return await fish.graphics.loadTexture(gl, url);
    };

    /**
     * Same as clear but uses components of the colour instead of an object.
     * @param r is the red part.
     * @param g is the green part.
     * @param b is the blue part.
     * @param a is the transparancy part.
     */
    this.clear = (r=1, g=1, b=1, a=1) => {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    /**
     * Clears the screen with a colour object.
     * @param colour is the colour to clear with.
     */
    this.clearColour = colour => {
        this.clear(colour.r, colour.g, colour.b, colour.a);
    };
};

fish.graphics.BLACK = new fish.graphics.Colour(0, 0, 0, 1);
fish.graphics.WHITE = new fish.graphics.Colour(1, 1, 1, 1);
fish.graphics.RED = new fish.graphics.Colour(1, 0, 0, 1);
fish.graphics.GREEN = new fish.graphics.Colour(0, 1, 0, 1);
fish.graphics.BLUE = new fish.graphics.Colour(0, 0, 1, 1);
