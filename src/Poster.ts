import Drawable from "./Shader";
import Texture from "./Texture";
import * as util from "./util";
import {Colour, WHITE} from './colours';
import { Resource } from "./Manager";

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
 * A rectangle to be drawn on the screen, potentially with one or more textures
 * and with a colour. Designed to be set up once and pretty much left how it is
 * until it is no longer needed. I guess if I need to be able to move one later
 * then I guess I will set that up but it's not really a primary concern.
 * TODO: the way this class is designed right now is that it is physically
 * impossible for it to update it's data after it's been created, which is
 * probably a bit dumb.
 */
export default class Poster extends Resource implements Drawable {
    gl: WebGLRenderingContext;
    textures: Texture[];
    vertices: WebGLBuffer;
    uvs: WebGLBuffer;
    colours: WebGLBuffer;

    constructor(
        gl: WebGLRenderingContext,
        textures: Texture[],
        vertices: WebGLBuffer,
        uvs: WebGLBuffer,
        colours: WebGLBuffer
    ) {
        super();
        this.gl = gl;
        this.textures = textures;
        this.vertices = vertices;
        this.uvs = uvs;
        this.colours = colours;
    }

    /**
     * Frees the sprite's resources and sets it as uninitialised.
     */
    free(): void {
        this.gl.deleteBuffer(this.vertices);
        this.gl.deleteBuffer(this.uvs);
        this.gl.deleteBuffer(this.colours);
    }

    predraw(): number {
        return 6;
    }

    static create(
        gl: WebGLRenderingContext,
        rect: util.Rect,
        uv: util.Rect|null = null,
        textures: Texture[] = [],
        colour: Colour = WHITE
    ): Promise<Poster> {
        return new Promise((resolve, reject) => {
            const vertices = gl.createBuffer();
            const uvs = gl.createBuffer();
            const colours = gl.createBuffer();
            if (!(vertices && uvs && colours)) {
                reject('Failed to set up buffers for poster');
                return;
            }
            const uvRect = uv || (textures.length > 0) ? textures[0].getRect() :
                util.rects.get().set(0, 0, 1, 1);
            const vertexArray = createVertexArray(rect);
            const uvArray = createVertexArray(uvRect.flipped(true, false));
            const colourArray = createColourArray(colour);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
            gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, uvs);
            gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, colours);
            gl.bufferData(gl.ARRAY_BUFFER, colourArray, gl.STATIC_DRAW);
            resolve(new Poster(gl, textures, vertices, uvs, colours));
        });
    }
}