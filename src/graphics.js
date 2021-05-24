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
 * Your graphics subsystem of choice can implement it's own font class which
 * can basically do whatever it needs to, but there are some things the engine
 * requires so that it can fit text.
 * @interface fish.graphics.Font
 */

/**
 * @method fish.graphics.Font#getHorizontalPadding
 * @return {number} the number of pixels to put between characters
 *         horizontally.
 */

/**
 * @method fish.graphics.Font#getVerticalPadding
 * @return {number} the number of pixels to put between lines of text.
 */

/**
 * @method fish.graphics.Font#getWidth
 * @param {number} c is the character code to get the width of.
 * @return {number} the width of the given character in pixels.
 */

/**
 * @method fish.graphics.Font#getLineHeight
 * @return {number} the height of lines drawn with this font.
 */

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
 * Font that is drawn using an 16x16 grid of characters all having the same
 * dimensions.
 * @implements fish.graphics.Font
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

    /** @inheritDoc */
    getHorizontalPadding() {
        return 0;
    }

    /** @inheritDoc */
    getVerticalPadding() {
        return 0;
    }

    /** @inheritDoc */
    getWidth(c) {
        return this.sprite.w / 16;
    }

    /** @inheritDoc */
    getLineHeight() {
        return this.sprite.h / 16;
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
    console.log(data);
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
     * @param {number} bord is the number of pixels from the outer edge to the
     *        interior.
     */
    constructor(rect, bord) {
        let hMid = rect.w - bord * 2;
        let vMid = rect.h - bord * 2;
        if (hMid < 1 || vMid < 1) {
            throw `${bord} is too wide a border for ${rect.w},${rect.h}`;
        }

        /**
         * Border width of the patch.
         * @readonly
         * @member {number}
         */
        this.BORDER = bord;

        /**
         * Top left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.TL = new fish.util.Rect(rect.x, rect.y, bord, bord);

        /**
         * Top part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.T = new fish.util.Rect(rect.x + bord, rect.y, hMid, bord);

        /**
         * Top right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.TR = new fish.util.Rect(rect.x + bord + hMid, rect.y, bord, bord);

        /**
         * mid left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.ML = new fish.util.Rect(rect.x, rect.y + bord, bord, vMid);

        /**
         * middle part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.M = new fish.util.Rect(rect.x + bord, rect.y + bord, hMid, vMid);

        /**
         * mid right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.MR = new fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord,
            bord,
            vMid
        );

        /**
         * bottom left part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.BL = new fish.util.Rect(rect.x, rect.y + bord + vMid, bord, bord);

        /**
         * bottom part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.B = new fish.util.Rect(
            rect.x + bord,
            rect.y + bord + vMid,
            hMid,
            bord
        );

        /**
         * bottom right part of the patch.
         * @readonly
         * @member {fish.util.Rect}
         */
        this.BR = new fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord + vMid,
            bord,
            bord
        );
    }
};

/**
 * Core functionality required by the engine for the graphics subsystem to
 * have.
 * @interface fish.graphics.BaseRenderer
 */

/**
 * Fill the screen with a colour.
 * @method fish.graphics.BaseRenderer#clear
 * @param {number} r the red component from 0 to 1.
 * @param {number} g the green component from 0 to 1.
 * @param {number} b the blue component from 0 to 1.
 * @param {number} a the transparent component from 0 to 1.
 */

/**
 * Creates a splash screen that works with this graphics subsystem.
 * @method fish.graphics.BaseRenderer#createSplashScreen
 * @param {fish.screen.Context} ctx given to the new screen so it can do it's
 *        shiet.
 * @param {Promise<fish.screen.Screen> init promise resolving to the first real
 *        screen of the game. You shouldn't need the return value of this, but
 *        you might want to know when it resolves for timing reasons.
 * @return {fish.screen.Screen} the created screen.
 */

/**
 * Tells you how compatable the subsystem is with the current browser running
 * it.
 * @method fish.graphics.BaseRenderer#getCompatability
 * @return {fish.Compatability} a report on the compatability. 
 */

/**
 * Base rendering interface required by the engine internally for gui stuff.
 * Must be implemented by something in order to use the gui but does not need
 * to be implemented by the graphics subsystem itself.
 * @interface
 */
fish.graphics.PatchRenderer = class {
    /**
     * Renders a 9 patch to the given spot.
     * @param {fish.graphics.Patch} patch is the 9patch to draw.
     * @param {fish.util.Rect} dst is the place on the screen to draw it.
     */
    renderPatch(patch, dst) {
        throw new Error(
            'fish.graphics.PatchRenderer.renderPatch must be implemented'
        );
    }

    /**
     * Renders a given character onto the screen, fitting it into the given
     * rectangle as best the renderer can.
     * @param {fish.graphics.Font} font is the font info for drawing.
     * @param {number} c the character code of the character to draw.
     * @param {fish.util.Rect} dst where to fit the character into. It ought to
     *        stretch if possible.
     */
    renderCharacter(font, c, dst) {
        throw new Error(
            'fish.graphics.PatchRenderer.renderCharacter must be implemented'
        );
    }

    /**
     * Renders a piece of text onto the screen using a font.
     * @param {fish.graphics.Font} font is the font to use to draw the text.
     * @param {string} text is the text to draw. All it's newlines and stuff
     *        are taken as written.
     * @param {fish.util.Vector} dst is the top left corner of where the text
     *        will appear on the screen.
     */
    renderText(font, text, dst) {
        throw new Error(
            'fish.graphics.PatchRenderer.renderText must be implemented'
        );
    }
};

/**
 * The default graphics handler which uses a sprite batch to draw nice
 * pictures.
 * @implements fish.graphics.BaseRenderer
 * @constructor
 * @param {WebGLRenderingContext} gl is the opengl context.
 */
fish.graphics.SpriteRenderer = function (gl) {
    let spareRect = new fish.util.Rect();
    let usedTextures = [];
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.gl = gl;
    this.width = gl.drawingBufferWidth;
    this.height = gl.drawingBufferHeight;


    /**
     * A thing that batches draw calls.
     * @constructor
     * @implements {fish.graphics.PatchRenderer}
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
                dst.x + patch.BORDER,
                dst.y + patch.BORDER
            );
            this.addComp(
                patch.B,
                dst.x + patch.BORDER,
                dst.y,
                dst.r - patch.BORDER,
                dst.y + patch.BORDER
            );
            this.addComp(
                patch.BR,
                dst.r - patch.BORDER,
                dst.y,
                dst.r,
                dst.y + patch.BORDER
            );
            this.addComp(
                patch.ML,
                dst.x,
                dst.y + patch.BORDER,
                dst.x + patch.BORDER,
                dst.t - patch.BORDER
            );
            this.addComp(
                patch.M,
                dst.x + patch.BORDER,
                dst.y + patch.BORDER,
                dst.r - patch.BORDER,
                dst.t - patch.BORDER
            );
            this.addComp(
                patch.MR,
                dst.r - patch.BORDER,
                dst.y + patch.BORDER,
                dst.r,
                dst.t - patch.BORDER
            );
            this.addComp(
                patch.TL,
                dst.x,
                dst.t - patch.BORDER,
                dst.x + patch.BORDER,
                dst.t
            );
            this.addComp(
                patch.T,
                dst.x + patch.BORDER,
                dst.t - patch.BORDER,
                dst.r - patch.BORDER,
                dst.t
            );
            this.addComp(
                patch.TR,
                dst.r - patch.BORDER,
                dst.t - patch.BORDER,
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
                    yOffset += height + font.getVerticalPadding();
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
                    xOffset += width + font.getHorizontalPadding();
                }
            }
        };

        /** @inheritDoc */
        this.renderPatch = (patch, dst) => {
            this.addPatch(patch, dst);
        };

        /** @inheritDoc */
        this.renderText = (font, text, dst) => {
            this.addText(font, text, dst);
        };

        /** @inheritDoc */
        this.renderCharacter = (font, c, dst) => {
            spareRect.size.set(font.getWidth(c), font.getLineHeight());
            spareRect.pos.set(
                font.sprite.x + Math.floor(c % 16) * spareRect.w,
                font.sprite.y + Math.floor(c / 16) * spareRect.h
            );
            this.add(spareRect, dst);
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

    /** @inheritDoc */
    this.clear = (r=1, g=1, b=1, a=1) => {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    /** @inheritDoc */
    this.createSplashScreen = (ctx, init) => {
        let InitScreen = class extends fish.screen.Screen {
            constructor(ctx) {
                super(ctx);
                this.done = false;
                this.next = null;
                this.batch = null;
                this.font = null;
                this.sound = null;
                this.logo = new fish.util.Rect();
                this.spot = new fish.util.Vector();
                this.lines = [
                    'fish-tank game engine version 645438567347',
                    'created by Dany Burton 2021'
                ];
                this.gfxComp = ctx.gfx.getCompatability();
                this.sndComp = ctx.snd.getCompatability();
                this.inComp = ctx.in.getCompatability();
                this.timer = 0;
                this.sprite = new fish.util.Rect(0, 0, 0, 0);
                Promise.all([
                    ctx.gfx.makeTexture(
                        fish.constants.SPLASH,
                        fish.constants.SPLASH_WIDTH,
                        fish.constants.SPLASH_HEIGHT,
                        ctx.gfx.gl.RGBA4
                    ),
                    ctx.snd.makeSample(fish.constants.JINGLE)
                ]).then(values => {
                    this.ctx.snd.playSample(values[1]);
                    this.font = new fish.graphics.BitmapFont(
                        values[0].getRect()
                    );
                    this.logo.pos.set(
                        this.font.getWidth('q') * 3,
                        this.font.getLineHeight() * 11
                    );
                    this.logo.size.set(
                        this.font.getWidth('c') * 4,
                        this.font.getLineHeight() * 4
                    );
                    this.batch = new ctx.gfx.Batch(values[0], 512);
                    (async function () {
                        await fish.util.wait(1);
                        this.lines.push(`graphics compatability ${this.gfxComp.level}: ${this.gfxComp.message}`);
                        await fish.util.wait(1);
                        this.lines.push(`sound compatability ${this.sndComp.level}: ${this.sndComp.message}`);
                        await fish.util.wait(1);
                        this.lines.push(`input compatability ${this.inComp.level}: ${this.inComp.message}`);
                        await fish.util.wait(1);
                        this.lines.push('the game is loading...');
                        await fish.util.wait(1);
                        this.done = true;
                    }).call(this);
                });
                init.then((v) => {this.next = v;});
            }

            /** @inheritDoc */
            update(delta) {
                this.timer += delta;
                if (this.next && this.done) {
                    return new fish.screen.Transition(true, this.next);
                }
                return null;
            }

            /** @inheritDoc */
            render(front) {
                if (!this.batch) return;
                this.batch.clear();
                let portion = 600 / (this.font.getLineHeight() * 12);
                let overhang = (this.timer * 32) % Math.abs(
                    this.font.getLineHeight() * 12 - portion
                ) - this.font.getLineHeight() * 12;
                for (let i = 0; i < portion; i++) {
                    this.batch.addComp(
                        this.logo,
                        0,
                        i * this.font.getLineHeight() * 12 + overhang,
                        this.logo.w * 3,
                        (i + 1) * this.font.getLineHeight() * 12 + overhang
                    );
                }
                this.spot.x = (this.font.getWidth('c') +
                    this.font.getHorizontalPadding()) * 12;
                for (let i = 0; i < this.lines.length; i++) {
                    this.spot.y = 600 - (this.font.getLineHeight() +
                        this.font.getVerticalPadding()) * i;
                    this.batch.addText(this.font, this.lines[i], this.spot);
                }
                this.batch.render();
            }
        };
        return new InitScreen(ctx);
    };

    /** @inheritDoc */
    this.getCompatability = () => {
        return new fish.Compatability(
            fish.COMPATABILITY_LEVEL.FULL,
            'all g'
        );
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
