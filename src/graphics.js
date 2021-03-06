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

    /**
     * Creates a rectangle object for the size of the texture with the corner
     * at (0, 0).
     * @return {fish.util.Rect} the rect.
     */
    this.getRect = () => {
        return new fish.util.Rect(0, 0, width, height);
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
    this.get = name => {
        if (name in sprites) return sprites[name];
        console.error(`unknown sprite name ${name}`);
        return new fish.util.Rect(0, 0, 0, 0);
    };

    /**
     * Gets a 9-patch out of the atlas and makes it for you. If you pass the
     * border argument then it is used to create the patch, but if you leave it
     * as 0 then it tries to use the name to discern the border size of the
     * patch by looking for a number at the end of the name. If neither of
     * those things are present then an error will be thrown.
     * @param {string} name name of the sprite the patch is made of.
     * @param {number} [border=0] the width of the borders of the patch.
     * @return {fish.graphics.Patch} the created patch.
     */
    this.getPatch = (name, border=0) => {
        let sprite = this.get(name);
        if (border <= 0) {
            let match = name.match(/\d+/);
            if (!match) {
                throw new Error(
                    'fish.graphics.Atlas.getPatch requires a border number ' +
                    'or a sprite with a name that ends with a number'
                );
            }
            border = parseInt(match[0]);
        }
        return new fish.graphics.Patch(sprite, border);
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
 * Font that is drawn using an 16x16 grid of characters all having the same
 * dimensions.
 */
fish.graphics.BitmapFont = class {
    /**
     * Creates it and adds the sprite to it yeah.
     * @param {fish.util.Rect} sprite is the sprite from which we get the
     *        characters.
     */
    constructor(sprite) {
        /**
         * The font's actual sprite.
         * @member
         * @type {fish.util.Rect}
         * @readonly
         */
        this.sprite = sprite;
    }

    /**
     * Gives you the width of the given character.
     * @param {number} c character code of the character to measure.
     * @return {number} the width of the character in pixels.
     */
    getWidth(c) {
        return this.sprite.w / 16;
    }

    /**
     * Gives you the height of lines in this font.
     * @return {number} the height of the line in pixels.
     */
    getLineHeight() {
        return this.sprite.h / 16;
    }

    /**
     * Gives you a rectangle made of characters from the font.
     * @param {number} x is the left offset of the rectangle in characters.
     * @param {number} y is the top offset of the rectangle in characters.
     * @param {number} w is the width of the rectangle in characters.
     * @param {number} h is the height of the rectangle in characters.
     * @return {fish.util.Rect} such a rect as was requested.
     */
    getRect(x, y, w, h) {
        return new fish.util.Rect(
            this.sprite.x + x * this.sprite.w / 16,
            this.sprite.y + y * this.sprite.h / 16,
            this.sprite.w / 16 * w,
            this.sprite.h / 16 * h
        );
    }

    /**
     * Creates a patch from a rectangle of characters in the font.
     * @param {number} x is the left offset of the rectangle in characters.
     * @param {number} y is the top offset of the rectangle in characters.
     * @param {number} w is the width of the rectangle in characters.
     * @param {number} h is the height of the rectangle in characters.
     * @param {number} border is the border of the patch in characters.
     * @return {fish.graphics.Patch} the relevant patch.
     */
    getPatch(x, y, w, h, border) {
        return new fish.graphics.Patch(
            this.getRect(x, y, w, h),
            this.sprite.w / 16 * border,
            this.sprite.h / 16 * border
        );
    }
};

/**
 * Asynchronously loads a texture out of a url. This function requires you to
 * pass a gl context so you probably want to use the version built into the
 * renderer unless you are making your own graphics system.
 * @async
 * @param {WebGLRenderingContext} gl the rendering context.
 * @param {string} url is the url to load the texture from.
 * @return {Promise<fish.graphics.Texture>} the loaded texture.
 */
fish.graphics.loadTexture = async function (gl, url) {
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
            reject(`failed loading image ${url}`);
        };
        image.src = url;
    });
};

/**
 * Make a texture out of an arraybuffer.
 * @param {WebGLRenderingContext} gl the rendering context.
 * @param {Uint8Array} data is the data to convert.
 * @param {number} width image width.
 * @param {number} height image height.
 * @param {GLenum} format is the pixel format of the data.
 * @return {fish.graphics.Texture} the created texture.
 */
fish.graphics.makeTexture = (gl, data, width, height, format) => {
    const glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        format,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_SHORT_4_4_4_4,
        data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return new fish.graphics.Texture(glTexture, width, height);
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
            new fish.util.Rect(rect.x, rect.y, rect.width, rect.height)
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
     * @param {fish.util.Rect} rect is the overall sprite to make the patch
     *        from.
     * @param {number} sideBorder is the border size to use on the sides.
     * @param {?number} [topBorder=null] is the border size to use on the top
     *        and bottom of the patch. If you leave this to default as null
     *        then it will just use sideBorder.
     */
    constructor(rect, sideBorder, topBorder=null) {
        if (topBorder === null) topBorder = sideBorder;
        let hMid = rect.w - sideBorder * 2;
        let vMid = rect.h - topBorder * 2;
        if (hMid < 1 || vMid < 1) {
            throw `${bord} is too wide a border for ${rect.w},${rect.h}`;
        }

        /**
         * Border width of the patch.
         * @readonly
         * @member {number}
         */
        this.SIDE_BORDER = sideBorder;

        /**
         * Border height of the patch.
         * @readonly
         * @member {number}
         */
        this.TOP_BORDER = topBorder;

        /**
         * Top left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.TL = new fish.util.Rect(rect.x, rect.y, sideBorder, topBorder);

        /**
         * Top part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.T = new fish.util.Rect(rect.x + sideBorder, rect.y, hMid, topBorder);

        /**
         * Top right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.TR = new fish.util.Rect(rect.x + sideBorder + hMid, rect.y, sideBorder, topBorder);

        /**
         * mid left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.ML = new fish.util.Rect(rect.x, rect.y + topBorder, sideBorder, vMid);

        /**
         * middle part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.M = new fish.util.Rect(rect.x + sideBorder, rect.y + topBorder, hMid, vMid);

        /**
         * mid right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.MR = new fish.util.Rect(
            rect.x + sideBorder + hMid,
            rect.y + topBorder,
            sideBorder,
            vMid
        );

        /**
         * bottom left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.BL = new fish.util.Rect(rect.x, rect.y + topBorder + vMid, sideBorder, topBorder);

        /**
         * bottom part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.B = new fish.util.Rect(
            rect.x + sideBorder,
            rect.y + topBorder + vMid,
            hMid,
            topBorder
        );

        /**
         * bottom right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.BR = new fish.util.Rect(
            rect.x + sideBorder + hMid,
            rect.y + topBorder + vMid,
            sideBorder,
            topBorder
        );
    }
};

/**
 * The graphics handler which uses a sprite batch to draw nice pictures.
 * @constructor
 * @param {WebGLRenderingContext} gl is the opengl context.
 */
fish.graphics.Renderer = function (gl) {
    let spareRect = new fish.util.Rect();
    let usedTextures = [];
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.gl = gl;
    this.size = new fish.util.Vector(
        gl.drawingBufferWidth,
        gl.drawingBufferHeight
    );


    /**
     * A thing that batches draw calls.
     * @constructor
     * @param {fish.graphics.Texture} texture is the texture all the draws must
     *        be from.
     * @param {number} max the max things to draw.
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
         * Adds the given sprite onto the given spot.
         * @param {fish.util.Rect} src is the sprite to draw.
         * @param {number} l the distance from left of screen to draw.
         * @param {number} b the distance from bottom of screen to draw.
         * @param {number} r the distance from right of screen to stop draw.
         * @param {number} t the distance from top of screen to stop draw.
         */
        this.addComp = (src, l, b, r, t) => {
            if (n >= max) return;
            const offset = n * 12;
            items[offset] = l;
            items[offset + 1] = b;
            items[offset + 2] = r;
            items[offset + 3] = b;
            items[offset + 4] = l;
            items[offset + 5] = t;
            items[offset + 6] = r;
            items[offset + 7] = b;
            items[offset + 8] = r;
            items[offset + 9] = t;
            items[offset + 10] = l;
            items[offset + 11] = t;
            textureItems[offset] = src.x;
            textureItems[offset + 1] = src.t;
            textureItems[offset + 2] = src.r;
            textureItems[offset + 3] = src.t;
            textureItems[offset + 4] = src.x;
            textureItems[offset + 5] = src.y;
            textureItems[offset + 6] = src.r;
            textureItems[offset + 7] = src.t;
            textureItems[offset + 8] = src.r;
            textureItems[offset + 9] = src.y;
            textureItems[offset + 10] = src.x;
            textureItems[offset + 11] = src.y;
            n++;
        };

        /**
         * Adds a sprite to the list of those to draw. I guess rotating would
         * be good but I would have to do it in software and I dunno what the
         * performance would be like.
         * @param {fish.util.Rect} src is the src rectangle from the texture.
         * @param {fish.util.Rect|fish.util.Vector} dst is where to draw it on
         * the screen. If it's a vector then that is the centre.
         * @param {number} scale is used to scale the sprite if you used
         * a vector. If you used a rect it does nothing.
         */
        this.add = (src, dst, scale=1) => {
            let l, r, t, b;
            if (dst instanceof fish.util.Rect) {
                l = dst.x;
                r = dst.r;
                b = dst.y;
                t = dst.t;
            } else if (dst instanceof fish.util.Vector) {
                let halfScale = scale * 0.5;
                l = dst.x - src.w * halfScale;
                r = dst.x + src.w * halfScale;
                b = dst.y + src.h * halfScale;
                t = dst.y - src.h * halfScale;
            } else {
                throw new TypeError(
                    'SpriteRenderer.Batch.add requres a Vector or a Rect'
                );
            }
            this.addComp(src, l, t, r, b);
        };


        /**
         * Draws a 9 patch at the given place. If you give an area that is too
         * small it will look munted beware.
         * @param patch is the 9patch to draw.
         * @param dst   is the place to draw it.
         */
        this.addPatch = (patch, dst) => {
            this.addComp(
                patch.BL,
                dst.x,
                dst.y,
                dst.x + patch.SIDE_BORDER,
                dst.y + patch.TOP_BORDER
            );
            this.addComp(
                patch.B,
                dst.x + patch.SIDE_BORDER,
                dst.y,
                dst.r - patch.SIDE_BORDER,
                dst.y + patch.TOP_BORDER
            );
            this.addComp(
                patch.BR,
                dst.r - patch.SIDE_BORDER,
                dst.y,
                dst.r,
                dst.y + patch.TOP_BORDER
            );
            this.addComp(
                patch.ML,
                dst.x,
                dst.y + patch.TOP_BORDER,
                dst.x + patch.SIDE_BORDER,
                dst.t - patch.TOP_BORDER
            );
            this.addComp(
                patch.M,
                dst.x + patch.SIDE_BORDER,
                dst.y + patch.TOP_BORDER,
                dst.r - patch.SIDE_BORDER,
                dst.t - patch.TOP_BORDER
            );
            this.addComp(
                patch.MR,
                dst.r - patch.SIDE_BORDER,
                dst.y + patch.TOP_BORDER,
                dst.r,
                dst.t - patch.TOP_BORDER
            );
            this.addComp(
                patch.TL,
                dst.x,
                dst.t - patch.TOP_BORDER,
                dst.x + patch.SIDE_BORDER,
                dst.t
            );
            this.addComp(
                patch.T,
                dst.x + patch.SIDE_BORDER,
                dst.t - patch.TOP_BORDER,
                dst.r - patch.SIDE_BORDER,
                dst.t
            );
            this.addComp(
                patch.TR,
                dst.r - patch.SIDE_BORDER,
                dst.t - patch.TOP_BORDER,
                dst.r,
                dst.t
            );
        };

        /**
         * Draws text using a bitmap font.
         * @param {fish.graphics.BitmapFont} font the font that has the text
         *        graphics and drawing info.
         * @param {string} text what to write including all newlines and stuff.
         * @param {fish.util.Vector} dst is where on the screen to write the
         *        text. Successive lines will decrease in y position.
         */
        this.addText = (font, text, dst) => {
            let width = font.getWidth('n');
            let height = font.getLineHeight();
            let xOffset = 0;
            let yOffset = 0;
            spareRect.size.set(width, height);
            for (let i = 0; i < text.length; i++) {
                let c = text.charCodeAt(i);
                if (c == 10) {
                    yOffset += height;
                    xOffset = 0;
                } else {
                    spareRect.pos.set(
                        font.sprite.x + Math.floor(c % 16) * width,
                        font.sprite.y + Math.floor(c / 16) * height
                    );
                    this.addComp(
                        spareRect,
                        dst.x + xOffset,
                        dst.y - yOffset - height,
                        dst.x + xOffset + width,
                        dst.y - yOffset
                    );
                    xOffset += width;
                }
            }
        };

        /**
         * Batch to draw a single character from a bitmap font somewhere on the
         * screen.
         * @param {fish.graphics.BitmapFont} font is the font to draw from.
         * @param {number} c character code of character to draw.
         * @param {fish.util.Rect|fish.util.Vector} dst place to put the
         *        character on the screen.
         */
        this.addCharacter = (font, c, dst) => {
            spareRect.size.set(font.getWidth(c), font.getLineHeight());
            spareRect.pos.set(
                font.sprite.x + Math.floor(c % 16) * spareRect.w,
                font.sprite.y + Math.floor(c / 16) * spareRect.h
            );
            this.add(spareRect, dst);
        };

        /** Blanks the contents of the batch to go again. */
        this.clear = () => {
            rendered = false;
            n = 0;
        };

        /** Renders what the batch currently has to the screen. */
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
     * Make a texture using this graphics thing's graphics context.
     * @param {Uint8Array} data the data to make it from.
     * @param {number} width image width.
     * @param {number} height image height.
     * @param {GLenum} format pixel format of the data.
     * @return {fish.graphics.Texture} the created texture.
     */
    this.makeTexture = (data, width, height, format) => {
        return fish.graphics.makeTexture(gl, data, width, height, format);
    };

    /**
     * Fill the screen with colour.
     * @param {number} r is the red part from 0 to 1.
     * @param {number} g is the green part from 0 to 1.
     * @param {number} b is the blue part from 0 to 1.
     * @param {number} a is the alpha part from 0 to 1.
     */
    this.clear = (r=1, g=1, b=1, a=1) => {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
};
