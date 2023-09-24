import { Drawable } from "./Shader";
import Texture from "./Texture";
import Font from './Font';
import {Colour, WHITE} from './colours';
import {Glyph} from './Font';
import * as util from "./util";

/**
 * Allows you to draw a bunch of ad hoc stuff that all uses portions of the
 * same texture, and upload it all to the GPU in one go so it's fast.
 */
export default class Batch extends Drawable {
    n: number = 0;
    max: number = 0
    texture?: Texture;
    vertexData?: Int16Array;
    uvData?: Int16Array;
    colourData?: Uint8Array;
    vertexBuffer?: WebGLBuffer;
    uvBuffer?: WebGLBuffer;
    colourBuffer?: WebGLBuffer;

    override getTextures() {
        if (this.ready()) return [this.texture!];
        return [];
    }

    override getVertexBuffer() {
        return this.vertexBuffer;
    }

    override getUVBuffer() {
        return this.uvBuffer;
    }

    override getColourBuffer() {
        return this.colourBuffer;
    }

    override draw() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertexData);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.uvData);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colourBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.colourData);
        return this.n * 6;
    }

    /**
     * Frees the batch's webgl resources and sets it as uninitialised.
     */
    free(): void {
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.uvBuffer);
        this.initialised = false;
    }

    /**
     * Initialises the batch.
     * @param gl rendering context.
     * @param texture texture to use for the rendering.
     * @param max max number of draws to batch in one go.
     * @returns true iff everything set up correctly.
     */
    init(
        gl: WebGLRenderingContext,
        texture: Texture,
        max: number,
        hint: GLenum = WebGLRenderingContext.DYNAMIC_DRAW
    ): boolean {
        if (!texture.ready()) {
            console.error('Trying to use uninitialised texture in batch');
            return false;
        }
        this.gl = gl;
        this.texture = texture;
        this.max = max;
        this.vertexData = new Int16Array(max * 12);
        this.uvData = new Int16Array(max * 12);
        this.colourData = new Uint8Array(max * 24);
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, hint);
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvData, hint);
        this.colourBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colourData, hint);
        this.initialised = true;
        return true;
    }

    /**
     * Adds something to be batched by it's basic components rather than with
     * a rectangle object or whatever.
     * @param src rectangle in texture to use.
     * @param l left side to appear on screen.
     * @param b bottom side to appear on screen.
     * @param r right side to appear on screen.
     * @param t top side to appear on screen.
     * @param colour is the colour data to give to the sprite.
     */
    addComp(
        src: util.Rect,
        l: number,
        b: number,
        r: number,
        t: number,
        colour: Colour = WHITE
    ): void {
        if (!this.ready()) {
            console.error('trying to add to uninitialised batch');
            return;
        }
        if (this.n >= this.max) return;
        const offset = this.n * 12;
        this.vertexData[offset] = l;
        this.vertexData[offset + 1] = b;
        this.vertexData[offset + 2] = r;
        this.vertexData[offset + 3] = b;
        this.vertexData[offset + 4] = l;
        this.vertexData[offset + 5] = t;
        this.vertexData[offset + 6] = r;
        this.vertexData[offset + 7] = b;
        this.vertexData[offset + 8] = r;
        this.vertexData[offset + 9] = t;
        this.vertexData[offset + 10] = l;
        this.vertexData[offset + 11] = t;
        this.uvData[offset] = src.pos.x;
        this.uvData[offset + 1] = src.t();
        this.uvData[offset + 2] = src.r();
        this.uvData[offset + 3] = src.t();
        this.uvData[offset + 4] = src.pos.x;
        this.uvData[offset + 5] = src.pos.y;
        this.uvData[offset + 6] = src.r();
        this.uvData[offset + 7] = src.t();
        this.uvData[offset + 8] = src.r();
        this.uvData[offset + 9] = src.pos.y;
        this.uvData[offset + 10] = src.pos.x;
        this.uvData[offset + 11] = src.pos.y;
        const colourOffset = this.n * 24;
        for (let i = 0; i < 6; i++) {
            this.colourData[colourOffset + i * 4] = colour.bytes[0];
            this.colourData[colourOffset + i * 4 + 1] = colour.bytes[1];
            this.colourData[colourOffset + i * 4 + 2] = colour.bytes[2];
            this.colourData[colourOffset + i * 4 + 3] = colour.bytes[3];
        }
        this.n++;
    }

    /**
     * Adds a sprite to the list of those to draw.
     * @param src is where to get the sprite image from in the texture.
     * @param dst is where on the screen to draw it, either as a rectangle or a
     *        centrepoint.
     * @param colour is colour data to give to the sprite.
     */
    add(src: util.Rect, dst: util.Rect|util.Vector2, colour=WHITE): void {
        let l: number, r: number, t: number, b: number;
        if (dst instanceof util.Rect) {
            l = dst.pos.x;
            r = dst.r();
            b = dst.pos.y;
            t = dst.t();
        } else if (dst instanceof util.Vector2) {
            l = dst.x - src.size.x * 0.5;
            r = dst.x + src.size.x * 0.5;
            b = dst.y + src.size.y * 0.5;
            t = dst.y - src.size.y * 0.5;
        }
        this.addComp(src, l, t, r, b, colour);
    }

    /**
     * Writes some text at a point on the screen.
     * @param text the text to write.
     * @param origin top left of the first character to write.
     * @param font the font to get the glyphs to draw from.
     * @param colour is the colour data to give the text.
     */
    addText(
        text: string,
        origin: util.Vector2,
        font: Font,
        colour = WHITE
    ): void {
        const cursor = util.vectors.get().copy(origin);
        cursor.y -= font.getLineHeight();
        let previousGlyph: Glyph|null = null;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code == 10) {
                previousGlyph = null;
                cursor.set(origin.x, cursor.y - font.getLineHeight());
            }
            if (previousGlyph && code in previousGlyph.kerning) {
                cursor.x += previousGlyph.kerning[code];
            }
            const glyph = font.get(code);
            if (!glyph) continue;
            this.addComp(
                glyph.src,
                cursor.x + glyph.offset.x,
                cursor.y + glyph.offset.y,
                cursor.x + glyph.offset.x + glyph.src.size.x,
                cursor.y + glyph.offset.y + glyph.src.size.y,
                colour
            );
            cursor.x += glyph.advance;
            previousGlyph = glyph;
        }
    }

    /**
     * Blanks all the content of the batch so that it can be started again.
     * This is not going to be mandatory to run like it used to be, so that you
     * can use the sprite batcher for more persistent forms that allow you to
     * save unnecessary redraws on guis or whatever.
     */
    clear(): void {
        this.n = 0;
    }
}