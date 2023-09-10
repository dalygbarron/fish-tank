import * as util from './util'

/**
 * Wraps a webgl texture and stores it's width and height so you don't need to
 * query them whenever you need that info.
 */
export class Texture {
    readonly glTexture: WebGLTexture;
    readonly w;
    readonly h;

    /**
     * Creates a texture wrapper.
     * @param glTexture opengl texture handle
     * @param w width of the texture
     * @param h height of the texture
     */
    constructor(glTexture: WebGLTexture, w: number, h: number) {
        this.glTexture = glTexture;
        this.w = w;
        this.h = h;
    }

    /**
     * gives you the size of the texture as a vector.
     * @returns size of the texture as a vector.
     */
    getSize(): util.Vector2 {
        return {x: this.w, y: this.h};
    }

    /**
     * Gives you the size of the texture as a rectangle.
     * @returns dimensions as a rectangle with top left corner at zero.
     */
    getRect(): util.Rect {
        return {x: 0, y: 0, w: this.w, h: this.h};
    }
};

/**
 * Representation of a 9 patch sprite that can be used to draw rectangles with
 * borders.
 */
export class Patch {
    readonly border: number;
    readonly tl: util.Rect;
    readonly top: util.Rect;
    readonly tr: util.Rect;
    readonly ml: util.Rect;
    readonly mid: util.Rect;
    readonly mr: util.Rect;
    readonly bl: util.Rect;
    readonly bottom: util.Rect;
    readonly br: util.Rect;

    /**
     * Creates the 9 patch from an existing sprite rectangle.
     * @param rect the area of the sprite to make into a 9patch.
     * @param border is amount of pixels on each side to become border.
     */
    constructor(rect: util.Rect, border: number) {
        const b = border;
        this.border = b;
        let hMid = Math.max(1, rect.w - border * 2);
        let vMid = Math.max(1, rect.h - border * 2);
        this.tl = {x: rect.x, y: rect.y, w: b, h: b};
        this.top = {x: rect.x + b, y: rect.y, w: hMid, h: b};
        this.tr = {x: rect.x + b + hMid, y: rect.y, w: b, h: b};
        this.ml = {x: rect.x, y: rect.y + b, w: b, h: vMid};
        this.mid = {x: rect.x + b, y: rect.y + b, w: hMid, h: vMid};
        this.mr = {x: rect.x + b + hMid, y: rect.y + b, w: border, h: vMid};
        this.bl = {x: rect.x, y: rect.y + b + vMid, w: b, h: b};
        this.bottom = {x: rect.x + b, y: rect.y + b + vMid, w: hMid, h: b};
        this.br = {x: rect.x + b + hMid, y: rect.y + b + vMid, w: b, h: b};
    }
}


/**
 * Texture atlas that can store a bunch of sprites in one texture.
 */
export class Atlas {
    private sprites: {[id: string]: util.Rect};

    /**
     * Adds a sprite location to the atlas.
     * @param id name to use to find the sprite later.
     * @param sprite the sprite rectangle to add.
     */
    add(id: string, sprite: util.Rect): void {
        this.sprites[id] = sprite;
    }

    /**
     * Gets a sprite out of the atlas if it exists.
     * @param id name for the sprite to find.
     * @returns the found sprite rect or an empty one if not found.
     */
    get(id: string): util.Rect {
        if (id in this.sprites) return this.sprites[id];
        console.error(`unknown sprite id ${id}`);
        return {x: 0, y: 0, w: 0, h: 0};
    }

    /**
     * Finds a given sprite and instantiates it as a 9patch with border width
     * in pixels determined by number at the start of the id. If these are not
     * present then an error will be printed and the 9patch returned will have a
     * border thickness of 1.
     * @param id the name of the sprite to find and create a 9patch from.
     * @returns the created 9patch.
     */
    getPatch(id: string): Patch {
        let sprite = this.get(id);
        let match = id.match(/\d+/);
        let border = 1;
        if (!match) {
            console.error(
                'attempting to create 9patch from sprite with no border number'
            );
        } else {
            border = parseInt(match[0]);
        }
        return new Patch(sprite, border);
    }

    /**
     * Calls a callback for all sprites in the atlas. Admittedly I dunno what
     * you would use this for besides debugging but it's here anyway.
     * @param callback function called for all sprites.
     */
    forEach(callback: (id: string, sprite: util.Rect) => void): void {
        for (let sprite in this.sprites) callback(sprite, this.sprites[sprite]);
    }
};

/**
 * A single character of a font.
 */
export class Glyph {
    readonly src: util.Rect;
    readonly offset: util.Vector2;
    readonly advance: number;
    readonly kerning: {[to: number]: number};

    /**
     * Creates the glyph object.
     * @param src is where in the texture used to render the glyph it appears.
     * @param offset is how much to offset the top left corner of this glyph
     *        when rendering.
     * @param advance base amount to advance horizontally for the next glyph.
     * @param kerning special advance distance modifiers per character. If not
     *        present for a given pair defaults to zero.
     */
    constructor(
        src: util.Rect,
        offset: util.Vector2,
        advance: number,
        kerning: {[to: number]: number}
    ) {
        this.src = src;
        this.offset = offset;
        this.advance = advance;
    }
};

/**
 * A font that can be used to render text on the screen. It is always some kind
 * of bitmap font, but the source of it's data and whether it's a monospace
 * font or whatever is a matter of configuration.
 */
export class Font {
    readonly size: number;
    readonly lineHeight: number;
    readonly glyphs: {[id: number]: Glyph};

    /**
     * 
     * @param size is the base font size.
     * @param lineHeight is the offset from one line to the next.
     * @param glyphs is the list of glyphs the font can draw enumerated by the
     *        utf16 codepoint.
     */
    constructor(
        size: number,
        lineHeight: number,
        glyphs: {[id: number]: Glyph}
    ) {
        this.size = size;
        this.lineHeight = lineHeight;
        this.glyphs = glyphs;
    }
};

/**
 * Asynchronously loads a texture from the given url. This version requires
 * you to pass in a webgl context so you might as well use the version built
 * into the Renderer object unless you aren't using that or something.
 * @param gl webgl context to create the texture.
 * @param url loads the texture data from here.
 * @returns promise to the created texture.
 */
export async function loadTexture(
    gl: WebGLRenderingContext,
    url: string
): Promise<Texture> {
    return await new Promise((resolve, reject) => {
        // TODO: should let you set these parameters.
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
            resolve(new Texture(texture!, image.width, image.height));
        };
        image.onerror = () => reject(`failed loading image ${url}`);
        image.src = url;
    });
}

/**
 * Makes a texture from an array buffer of data. Again renderer should have
 * a version of this with no need to pass the gl context.
 * @param gl webgl context.
 * @param data pixel data.
 * @param size final dimensions of texture.
 * @param format webgl image data format.
 * @returns created texture.
 */
export function makeTexture(
    gl: WebGLRenderingContext,
    data: Uint8Array,
    size: util.Vector2,
    format: GLenum
): Texture {
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
    return new Texture(glTexture!, width, height);
}

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
