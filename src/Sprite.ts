import { Drawable } from "./Shader";
import Texture from "./Texture";
import { Rect } from "./util";

/**
 * Creates a float array containing a rectangle made up of 2 triangles.
 * @param rect rectangle of where the sprite should be on the screen.
 * @returns array containing both with vertex data being first 12 items and uv
 *          data the following 12.
 */
function createVertexArray(rect: Rect): Float32Array {
    const items = new Float32Array(12);
    items[0] = rect.x;
    items[1] = rect.y;
    items[2] = rect.r();
    items[3] = rect.y;
    items[4] = rect.x;
    items[5] = rect.t();
    items[6] = rect.r();
    items[7] = rect.y;
    items[8] = rect.r();
    items[9] = rect.t();
    items[10] = rect.x;
    items[11] = rect.t();
    return items;
}

/**
 * A rectangle to be drawn on the screen, potentially with one or more textures.
 */
export default class Sprite extends Drawable {
    textures: Texture[];
    buffer: WebGLBuffer;
    textureBuffer: WebGLBuffer;

    /**
     * Frees the sprite's resources and sets it as uninitialised.
     */
    free(): void {
        this.gl.deleteBuffer(this.buffer);
        this.gl.deleteBuffer(this.textureBuffer);
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
        rect: Rect,
        uv: Rect|null = null,
        textures: Texture[] = []
    ): boolean {
        this.gl = gl;
        this.textures = textures;
        const buffer = gl.createBuffer();
        const textureBuffer = gl.createBuffer();
        if (!(buffer && textureBuffer)) {
            console.error('Failed to set up buffers for sprite');
            return false;
        }
        this.buffer = buffer;
        this.textureBuffer = textureBuffer;
        const uvRect = uv || (textures.length > 0) ? textures[0].getRect() :
            new Rect(0, 0, 1, 1);
        const vertexArray = createVertexArray(rect);
        const uvArray = createVertexArray(uvRect.flipped(true, false));
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);


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

    override draw() {
        return 6;
    }
}