var fish = fish || {};

/**
 * This file provides functionality for doing graphics stuff. A lot of it is
 * made publically accessible so that if you don't like the SpriteRenderer
 * class for rendering, you can create your own class and use as much existing
 * functionality as possible to save you some time and potentially make
 * different rendering classes as interoperable as practical.
 * So, unless you want to make your own rendering class, probably the only
 * thing you are going to use from this file is SpriteRenderer.
 * @namespace
 */
fish.graphics = {};

/**
 * Creates a texture object out of a gl texture. You probably don't want to
 * instantiate one of these directly unless you are creating your own graphics
 * system.
 * @constructor
 * @param {number} glTexture is the open gl reference to the texture.
 * @param {number} width     is the width of the texture.
 * @param {number} height    is the height of the texture.
 */
fish.graphics.Texture = function (glTexture, width, height) {
    /**
     * Gives you the opengl texture.
     * @return {number} the opengl reference to the texture.
     */
    this.getGlTexture = () => {
        return glTexture;
    };

    /**
     * Gives you the width of the texture.
     * @return {number} the width.
     */
    this.getWidth = () => {
        return width;
    };

    /**
     * Gives you the height of the texture.
     * @return {number} the height.
     */
    this.getHeight = () => {
        return height;
    };
};

/**
 * Stores sprites. You probably don't want to instantiate one of these directly
 * unless you are creating your own graphics system.
 * @constructor
 */
fish.graphics.Atlas = function () {
    let sprites = {};

    /**
     * Adds a sprite into the atlas.
     * @param {string}         name   is the name of the atlas.
     * @param {fish.util.Rect} sprite is the sprite to add.
     */
    this.add = (name, sprite) => {
        sprites[name] = sprite;
    };

    /**
     * Gets a sprite out of the atlas.
     * @param {string} name is the name of the sprite to get.
     * @return {fish.util.Rect} the sprite found or an empty one if it lacks it.
     */
    this.get = (name) => {
        if (name in this.sprites) return this.sprites[name];
        console.error(`unknown sprite name ${name}`);
        return new fish.util.Rect(0, 0, 0, 0);
    };

    /**
     * Tells you the number of sprites.
     * @return {number} the number of sprites.
     */
    this.n = () => {
        return Object.keys(sprites).length;
    };

    /**
     * The atlas foreach callback structure which gets called on each sprite in
     * the atlas.
     * @callback fish.graphics.Atlas~callback
     * @param {string}         name   is the name of the sprite.
     * @param {fish.util.Rect} sprite is the sprite.
     */

    /**
     * Iterates over all sprites in the atlas.
     * @param {fish.graphics.Atlas~callback} callback is a callback to run for each one.
     */
    this.forEach = callback => {
        for (let sprite in sprites) callback(sprite, sprites[sprite]);
    };
};

/**
 * Represents a colour with parts from 0 to 1.
 * @constructor
 * @param {number} r is the red part.
 * @param {number} g is the green part.
 * @param {number} b is the blue part.
 * @param {number} a is the transparancy part.
 */
fish.graphics.Colour = function (r=1, g=1, b=1, a=1) {
    /** 
     * Red component of the colour from 0 to 1.
     * @member {number}
     */
    this.r = r;

    /**
     * Green component of the colour from 0 to 1.
     * @member {number}
     */
    this.g = g;

    /**
     * Blue component of the colour from 0 to 1.
     * @member {number}
     */
    this.b = b;

    /**
     * The transparancy part of the colour from 0 to 1.
     * @member {number}
     */
    this.a = a;
};

/**
 * Asynchronously loads a texture out of a url. This function requires you to
 * pass a gl context so you probably want to use the version built into the
 * renderer unless you are making your own graphics system.
 * @async
 * @param {string} url is the url to load the texture from.
 * @return {Promise<fish.graphics.Texture>} the loaded texture.
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
 * @async
 * @param {string} url is the url to load it from.
 * @return {Promise<fish.graphics.Atlas>} the created atlas.
 */
fish.graphics.loadAtlas = async function (url) {
    let text = await fish.util.loadText(url);
    if (text == null) return null;
    let data = JSON.parse(text);
    let atlas = new fish.graphics.Atlas();
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
 * 9 patch implementation that uses a sprite rectangle for each part of the
 * patch. This is just the object that holds the data for the 9 patch.
 */
fish.graphics.Patch = class {
    /**
     * Creates it by giving a sprite and a border around the outside which
     * becomes the non middle parts.
     * @param rect is the overall sprite to make the patch from.
     * @param born is the width of the border of the patch.
     */
    constructor(rect, bord) {
        let hMid = rect.w - bord * 2;
        let vMid = rect.h - bord * 2;
        if (hMid < 1 || vMid < 1) {
            throw `${bord} is too wide a border for ${rect.w},${rect.h}`;
        }
        let tl = fish.util.Rect(rect.x, rect.y, bord, bord);
        let t = fish.util.Rect(rect.x + bord, rect.y, hMid, bord);
        let tr = fish.util.Rect(rect.x + bord + hMid, rect.y, bord, bord);
        let ml = fish.util.Rect(rect.x, rect.y + bord, bord, vMid);
        let m = fish.util.Rect(rect.x + bord, rect.y + bord, hMid, vMid);
        let mr = fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord,
            bord,
            vMid
        );
        let bl = fish.util.Rect(rect.x, rect.y + bord + vMid, bord, bord);
        let b = fish.util.Rect(
            rect.x + bord,
            rect.y + bord + vMid,
            hMid,
            bord
        );
        let br = fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord + vMid,
            bord,
            bord
        );
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get tl() {
        return tl;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get t() {
        return t;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get tr() {
        return tr;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get ml() {
        return ml;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get m() {
        return m;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get mr() {
        return mr;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get bl() {
        return bl;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get b() {
        return b;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get br() {
        return br;
    }

    /**
     * Gives you the rect's border size.
     * @return the border size as in perpendicular distance from the outside.
     */
    get border() {
        return border;
    }
};

/**
 * The default graphics handler which uses a sprite batch to draw nice
 * pictures.
 * @constructor
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
     * @constructor
     * @param {fish.graphics.Texture} texture is the texture all the draws must
     *                                        be from.
     * @param {number}                max     is the max things to draw.
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
         * Adds a sprite to the list of those to draw.
         * @param {fish.util.Rect} src is the src rectangle from the texture.
         * @param {fish.util.Rect|fish.util.Vector} dst is where to draw it on
         * the screen. If it's a vector then that is the centre.
         * @param {number} scale is used to scale the sprite if you used
         * a vector. If you used a rect it does nothing.
         */
        this.add = (src, dst, scale=1) => {
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
         * Draws a 9 patch at the given place. If you give an area that is too
         * small it will look munted beware.
         * @param patch is the 9patch to draw.
         * @param dst   is the place to draw it.
         */
        this.addPatch = (patch, dst) => {
            let rect = new fish.util.Rect(0, 0, 0, 0);
            this.add(patch.tl, new fish.util.Rect(
                dst.x,
                dst.y,
                patch.border,
                patch.border
            ));
            this.add(patch.t, new fish.util.Rect(
                dst.x + patch.border,
                dst.y,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.tr, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y,
                patch.border,
                patch.border
            ));
            this.add(patch.ml, new fish.util.Rect(
                dst.x,
                dst.y + patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.m, new fish.util.Rect(
                dst.x + patch.border,
                dst.y + patch.border,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.mr, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y + patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.bl, new fish.util.Rect(
                dst.x,
                dst.y + dst.h - patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.b, new fish.util.Rect(
                dst.x + patch.border,
                dst.y + dst.h - patch.border,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.br, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y + dst.h - patch.border,
                patch.border,
                patch.border
            ));
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
            gl.activeTexture(gl.TEXTURE0);
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
     * @param {string} url is the url of the texture to load.
     * @return {Promise<fish.graphics.Texture>} the texture if it worked.
     */
    this.loadTexture = async function (url) {
        return await fish.graphics.loadTexture(gl, url);
    };

    /**
     * Same as clear but uses components of the colour instead of an object.
     * @param {number} r is the red part.
     * @param {number} g is the green part.
     * @param {number} b is the blue part.
     * @param {number} a is the transparancy part.
     */
    this.clear = (r=1, g=1, b=1, a=1) => {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    /**
     * Clears the screen with a colour object.
     * @param {fish.graphics.Colour} colour is the colour to clear with.
     */
    this.clearColour = colour => {
        this.clear(colour.r, colour.g, colour.b, colour.a);
    };
};

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.BLACK = new fish.graphics.Colour(0, 0, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.WHITE = new fish.graphics.Colour(1, 1, 1, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.RED = new fish.graphics.Colour(1, 0, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.GREEN = new fish.graphics.Colour(0, 1, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.BLUE = new fish.graphics.Colour(0, 0, 1, 1);
