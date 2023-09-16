import * as util from './util'
import * as shaders from './Shader'

// here are some useful details I deleted from somewhere else:
// gl.disable(gl.DEPTH_TEST);
// gl.enable(gl.BLEND);
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
     * @param b is amount of pixels on each side to become border.
     */
    constructor(rect: util.Rect, b: number) {
        this.border = b;
        let hMid = Math.max(1, rect.w - b * 2);
        let vMid = Math.max(1, rect.h - b * 2);
        this.tl = new util.Rect(rect.x, rect.y, b, b);
        this.top = new util.Rect(rect.x + b, rect.y, hMid, b);
        this.tr = new util.Rect(rect.x + b + hMid, rect.y, b, b);
        this.ml = new util.Rect(rect.x, rect.y + b, b, vMid);
        this.mid = new util.Rect(rect.x + b, rect.y + b, hMid, vMid);
        this.mr = new util.Rect(rect.x + b + hMid, rect.y + b, b, vMid);
        this.bl = new util.Rect(rect.x, rect.y + b + vMid, b, b);
        this.bottom = new util.Rect(rect.x + b, rect.y + b + vMid, hMid, b);
        this.br = new util.Rect(rect.x + b + hMid, rect.y + b + vMid, b, b);
    }
}


/**
 * Texture atlas that can store a bunch of sprites in one texture.
 */
export class Atlas {
    private sprites: {[id: string]: util.Rect} = {};

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
        return new util.Rect(0, 0, 0, 0);
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
 * Loads in the data part of a texture atlas.
 * @param url where the data is loaded from.
 * @returns a promise that resolves to the loaded atlas object.
 */
export function loadAtlas(url: string): Promise<Atlas> {
    return new Promise(async (resolve, reject) => {
        let text = await util.loadText(url);
        if (text == null) {
            reject(`couldn't load atlas data from ${url}`);
            return;
        }
        let data = JSON.parse(text);
        let atlas = new Atlas();
        for (let frame in data) {
            let rect = data[frame];
            atlas.add(
                frame,
                new util.Rect(rect.x, rect.y, rect.width, rect.height)
            );
        }
        resolve(atlas);
    });
};

/**
 * A sprite batcher.
 */
export class Batch {
    gl: WebGLRenderingContext;
    texture: Texture;
    max: number;
    items: Float32Array;
    textureItems: Float32Array;
    n: number;
    buffer: WebGLBuffer;
    textureBuffer: WebGLBuffer;
    inverseSize: util.Vector2;

    constructor(
        gl: WebGLRenderingContext,
        texture: Texture,
        max: number,
        hint: GLenum = WebGLRenderingContext.DYNAMIC_DRAW
    ) {
        this.gl = gl;
        this.texture = texture;
        this.max = max;
        this.items = new Float32Array(max * 12);
        this.textureItems = new Float32Array(max * 12);
        this.n = 0;
        this.inverseSize = new util.Vector2(
            1 / texture.size.x,
            1 / texture.size.y
        );
        this.buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.items, hint);
        this.textureBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.textureItems, hint);
    }

    /**
     * Adds a sprite to the screen by components of a rectangle, but not
     * defined by width and height, but rather all by distances from left and
     * from bottom.
     * @param src bounds of the source texture.
     * @param l distance from left to start drawing.
     * @param b distance from bottom to start drawing.
     * @param r distance from left to stop drawing.
     * @param t distance from bottom to stop drawing.
     */
    addComp(src: util.Rect, l: number, b: number, r: number, t: number): void {
        if (this.n >= this.max) return;
        const offset = this.n * 12;
        this.items[offset] = l;
        this.items[offset + 1] = b;
        this.items[offset + 2] = r;
        this.items[offset + 3] = b;
        this.items[offset + 4] = l;
        this.items[offset + 5] = t;
        this.items[offset + 6] = r;
        this.items[offset + 7] = b;
        this.items[offset + 8] = r;
        this.items[offset + 9] = t;
        this.items[offset + 10] = l;
        this.items[offset + 11] = t;
        this.textureItems[offset] = src.x;
        this.textureItems[offset + 1] = src.t();
        this.textureItems[offset + 2] = src.r();
        this.textureItems[offset + 3] = src.t();
        this.textureItems[offset + 4] = src.x;
        this.textureItems[offset + 5] = src.y;
        this.textureItems[offset + 6] = src.r();
        this.textureItems[offset + 7] = src.t();
        this.textureItems[offset + 8] = src.r();
        this.textureItems[offset + 9] = src.y;
        this.textureItems[offset + 10] = src.x;
        this.textureItems[offset + 11] = src.y;
        this.n++;
    }

    /**
     * Adds a sprite to the list of those to draw.
     * @param src is where to get the sprite image from in the texture.
     * @param dst is where on the screen to draw it, either as a rectangle or a
     *        centrepoint.
     */
    add(src: util.Rect, dst: util.Rect|util.Vector2) {
        let l, r, t, b;
        if (dst instanceof util.Rect) {
            l = dst.x;
            r = dst.r;
            b = dst.y;
            t = dst.t;
        } else if (dst instanceof util.Vector2) {
            l = dst.x - src.w * 0.5;
            r = dst.x + src.w * 0.5;
            b = dst.y + src.h * 0.5;
            t = dst.y - src.h * 0.5;
        }
        this.addComp(src, l, t, r, b);
    };

    /**
     * Draws a 9 patch at the given place. If you give an area that is too
     * small it will look munted beware.
     * @param patch is the 9patch to draw.
     * @param dst   is the place to draw it.
     */
    addPatch(patch: Patch, dst: util.Rect) {
        this.addComp(
            patch.bl,
            dst.x,
            dst.y,
            dst.x + patch.border,
            dst.y + patch.border
        );
        this.addComp(
            patch.bottom,
            dst.x + patch.border,
            dst.y,
            dst.r() - patch.border,
            dst.y + patch.border
        );
        this.addComp(
            patch.br,
            dst.r() - patch.border,
            dst.y,
            dst.r(),
            dst.y + patch.border
        );
        this.addComp(
            patch.bl,
            dst.x,
            dst.y + patch.border,
            dst.x + patch.border,
            dst.t() - patch.border
        );
        this.addComp(
            patch.mid,
            dst.x + patch.border,
            dst.y + patch.border,
            dst.r() - patch.border,
            dst.t() - patch.border
        );
        this.addComp(
            patch.mr,
            dst.r() - patch.border,
            dst.y + patch.border,
            dst.r(),
            dst.t() - patch.border
        );
        this.addComp(
            patch.tl,
            dst.x,
            dst.t() - patch.border,
            dst.x + patch.border,
            dst.t()
        );
        this.addComp(
            patch.top,
            dst.x + patch.border,
            dst.t() - patch.border,
            dst.r() - patch.border,
            dst.t()
        );
        this.addComp(
            patch.tr,
            dst.r() - patch.border,
            dst.t() - patch.border,
            dst.r(),
            dst.t()
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
    addText(font, text, dst) {
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
    addCharacter(font, c, dst) {
        spareRect.size.set(font.getWidth(c), font.getLineHeight());
        spareRect.pos.set(
            font.sprite.x + Math.floor(c % 16) * spareRect.w,
            font.sprite.y + Math.floor(c / 16) * spareRect.h
        );
        this.add(spareRect, dst);
    };

    /**
     * Blanks all the content of the batch so that it can be started again.
     * This is not going to be mandatory to run like it used to be, so that you
     * can use the sprite batcher for more persistent forms that allow you to
     * save unnecessary redraws on guis or whatever.
     */
    clear(): void {
        this.n = 0;
    };

    /** Renders what the batch currently has to the screen. */
    render() {
        const shader = shaders.bindDefaultShader(this.gl);
        if (!shader) return;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.items);
        this.gl.vertexAttribPointer(shader.position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shader.position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.textureItems);
        this.gl.vertexAttribPointer(
            shader.textureCoord,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(shader.textureCoord);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture.getGlTexture());
        this.gl.uniform1i(shader.sampler, 0);
        this.gl.uniform2f(
            shader.invTextureSize,
            1 / this.texture.getWidth(),
            1 / this.texture.getHeight()
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.n * 6);
    };
};

/**
 * Fill the screen with colour.
 * @param gl is the webgl rendering context to use.
 * @param r is the red part from 0 to 1.
 * @param g is the green part from 0 to 1.
 * @param b is the blue part from 0 to 1.
 * @param a is the alpha part from 0 to 1.
 */
export function clear (gl: WebGLRenderingContext, r = 1, g = 1, b = 1, a = 1) {
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
};