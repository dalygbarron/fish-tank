import { Drawable } from "./Shader";
import Texture from "./Texture";
import * as util from "./util";

/**
 * Allows you to draw a bunch of ad hoc stuff that all uses portions of the
 * same texture, and upload it all to the GPU in one go so it's fast.
 */
export default class Batch extends Drawable {
    gl: WebGLRenderingContext;
    texture: Texture;
    max: number;
    vertexData: Float32Array;
    uvData: Float32Array;
    n: number = 0;
    vertexBuffer: WebGLBuffer;
    uvBuffer: WebGLBuffer;

    override getTextures() {
        return [this.texture];
    }

    override getVertexBuffer() {
        return this.vertexBuffer;
    }

    override getUVBuffer() {
        return this.uvBuffer;
    }

    override draw() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertexData);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.uvData);
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
        this.vertexData = new Float32Array(max * 12);
        this.uvData = new Float32Array(max * 12);
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, hint);
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvData, hint);
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
     */
    addComp(src: util.Rect, l: number, b: number, r: number, t: number): void {
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
        this.uvData[offset] = src.x;
        this.uvData[offset + 1] = src.t();
        this.uvData[offset + 2] = src.r();
        this.uvData[offset + 3] = src.t();
        this.uvData[offset + 4] = src.x;
        this.uvData[offset + 5] = src.y;
        this.uvData[offset + 6] = src.r();
        this.uvData[offset + 7] = src.t();
        this.uvData[offset + 8] = src.r();
        this.uvData[offset + 9] = src.y;
        this.uvData[offset + 10] = src.x;
        this.uvData[offset + 11] = src.y;
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