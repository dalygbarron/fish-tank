import { Drawable } from "./Shader";
import Texture from "./Texture";
import * as util from "./util";
import {Colour, RED} from './colours';

/**
 * Creates a float array containing a rectangle made up of 2 triangles.
 * @param rect rectangle of where the sprite should be on the screen.
 * @returns array containing both with vertex data being first 12 items and uv
 *          data the following 12.
 */
function createVertexArray(rect: util.Rect): Int16Array {
    const items = new Int16Array(12);
    items[0] = rect.pos.x;
    items[1] = rect.pos.y;
    items[2] = rect.r();
    items[3] = rect.pos.y;
    items[4] = rect.pos.x;
    items[5] = rect.t();
    items[6] = rect.r();
    items[7] = rect.pos.y;
    items[8] = rect.r();
    items[9] = rect.t();
    items[10] = rect.pos.x;
    items[11] = rect.t();
    return items;
}

/**
 * Creates an array of vertex colour values.
 * @param colour is the colour to turn into an array.
 * @return the created array.
 */
function createColourArray(colour: Colour): Uint8Array {
    const items = new Uint8Array(24);
    for (let i = 0; i < 6; i++) {
        items[i * 4] = colour.bytes[0];
        items[i * 4 + 1] = colour.bytes[1];
        items[i * 4 + 2] = colour.bytes[2];
        items[i * 4 + 3] = colour.bytes[3];
    }
    return items;
}

/**
 * A rectangle to be drawn on the screen, potentially with one or more textures.
 */
export default class Sprite extends Drawable {
    textures: Texture[];
    buffer: WebGLBuffer;
    textureBuffer: WebGLBuffer;
    colourBuffer: WebGLBuffer;

    /**
     * Frees the sprite's resources and sets it as uninitialised.
     */
    free(): void {
        this.gl.deleteBuffer(this.buffer);
        this.gl.deleteBuffer(this.textureBuffer);
        this.gl.deleteBuffer(this.colourBuffer);
        this.initialised = false;
    }

    /**
     * Initialises the sprite.
     * @param gl webgl context.
     * @param rect screen space location.
     * @param uv texture mapping. Default is size of first texture or unit size.
     * @param textures list of textures the sprite is drawn with.
     * @returns true iff successful.
     */
    init(
        gl: WebGLRenderingContext,
        rect: util.Rect,
        uv: util.Rect|null = null,
        textures: Texture[] = []
    ): boolean {
        this.gl = gl;
        this.textures = textures;
        const buffer = gl.createBuffer();
        const textureBuffer = gl.createBuffer();
        const colourBuffer = gl.createBuffer();
        if (!(buffer && textureBuffer && colourBuffer)) {
            console.error('Failed to set up buffers for sprite');
            return false;
        }
        this.buffer = buffer;
        this.textureBuffer = textureBuffer;
        this.colourBuffer = colourBuffer;
        const uvRect = uv || (textures.length > 0) ? textures[0].getRect() :
            util.rects.get().set(0, 0, 1, 1);
        const vertexArray = createVertexArray(rect);
        const uvArray = createVertexArray(uvRect.flipped(true, false));
        const colourArray = createColourArray(RED);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colourArray, gl.STATIC_DRAW);
        this.initialised = true;
        return true;
    }

    override getTextures() {
        return this.textures;
    }

    override getVertexBuffer() {
        return this.buffer;
    }

    override getUVBuffer() {
        return this.textureBuffer;
    }

    override getColourBuffer() {
        return this.colourBuffer;
    }

    override draw() {
        return 6;
    }
}