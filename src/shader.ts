import { Resource } from './Manager';
import Texture from './Texture';
import * as util from './util';

const JSON_SCHEMA = {
    type: 'object',
    properties: {

    }
};

const defaultVert = `
attribute vec2 position;
attribute vec2 uv;
attribute vec4 colour;
uniform vec2 canvasInv;
uniform vec2 textureInv;
uniform vec2 critterInv;
varying highp vec2 vTextureCoord;
varying highp vec2 vCritterCoord;
varying highp vec2 vPosition;
varying mediump vec4 vColour;
void main() {
    gl_Position = vec4(
      position * canvasInv * 2.0 - vec2(1.0, 1.0),
      0.0,
      1.0
    );
    vTextureCoord = uv * textureInv;
    vCritterCoord = uv * critterInv;
    vPosition = position;
    vColour = colour;
}`;

const defaultFrag = `
uniform sampler2D texture;
varying highp vec2 vTextureCoord;
varying mediump vec4 vColour;
void main() {
    gl_FragColor = texture2D(texture, vTextureCoord) * vColour;
}`;

/**
 * Loads in a shader as in like a fragment or vertex shader.
 * @param gl webgl context.
 * @param type whether fragment or vertex or whatever.
 * @param source source code as normal text.
 * @returns created shader or null if it was impossible to be done. If it was
 *          impossible then an error should have been logged.
 */
function loadShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader|null {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            'Could not compile shader: ' + gl.getShaderInfoLog(shader)
        );
        return null;
    }
    return shader;
}

/**
 * Something that can be drawn by a shader.
 * TODO: if at a later point we add instanced 3d rendering we might need to
 * update this a bit.
 */
export interface Drawable {
    vertices: WebGLBuffer;
    uvs?: WebGLBuffer;
    colours?: WebGLBuffer;
    textures?: Texture[];

    /**
     * This is called before the drawable is drawn by the shader and lets it
     * set up it's shit.
     */
    predraw(): number;
};

/**
 * Stores a shader program and associated info.
 */
export default class Shader extends Resource {
    private gl: WebGLRenderingContext;
    private vert: WebGLShader;
    private frag: WebGLShader;
    private program: WebGLProgram;
    private position: number;
    private uv: number;
    private colour: number;
    private invCanvas: WebGLUniformLocation|null;
    private time: WebGLUniformLocation|null;
    private samplers: {
        sampler: WebGLUniformLocation|null,
        invSize: WebGLUniformLocation|null
    }[] = [];
    private extras: {[id: string]: WebGLUniformLocation|null} = {};

    /**
     * Just inserts literally everything the shader needs. Prolly not wise to
     * call directly.
     * @param gl gl context.
     * @param vert created vertex shader.
     * @param frag created fragment shader.
     * @param program created shader program.
     * @param position position vertex param id.
     * @param uv uv vertex param id.
     * @param colour colour vertex param id.
     * @param invCanvas inverse canvas size uniform location.
     * @param time time uniform location.
     * @param samplers list of sampler and corresponding invSize uniforms.
     * @param extras list of extra uniform locations.
     */
    constructor(
        gl: WebGLRenderingContext,
        vert: WebGLShader,
        frag: WebGLShader,
        program: WebGLProgram,
        position: number,
        uv: number,
        colour: number,
        invCanvas: WebGLUniformLocation|null,
        time: WebGLUniformLocation|null,
        samplers: {
            sampler: WebGLUniformLocation|null,
            invSize: WebGLUniformLocation|null
        }[],
        extras: {[id: string]: WebGLUniformLocation|null}
    ) {
        super();
        this.gl = gl;
        this.vert = vert;
        this.frag = frag;
        this.program = program;
        this.position = position;
        this.uv = uv;
        this.colour = colour;
        this.invCanvas = invCanvas;
        this.time = time;
        this.samplers = samplers;
        this.extras = extras;
    }

    /**
     * Frees the shader's resources and lets you use it for something else.
     * @param gl webgl context for getting at the resources.
     */
    free(): void {
        this.gl.deleteProgram(this.program);
        this.gl.deleteShader(this.frag);
        this.gl.deleteShader(this.vert);
    }

    /**
     * Tries to initialise the shader program with two shader pieces and some
     * stuff.
     * @param gl is the webglrenderingcontext.
     * @param textures is a named list of textures to make available to the
     *        shader program as samplers. Worth noting the default shader
     *        expects one texture called texture.
     * @param extras is any extra uniforms to be aware of. Does not give them
     *        any value.
     */
    init(
        gl: WebGLRenderingContext,
        fragSrc: string|null = null,
        vertSrc: string|null = null,
        samplers: string[] = ['texture'],
        extras: string[] = []
    ): boolean {
        this.gl = gl;
        let fragName = fragSrc || 'defaultFrag';
        let vertName = vertSrc || 'defaultVert';
        let programName = `shaderProgram(${fragName}, ${vertName})`;
        // Compiling the shader program.
        const frag = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc || defaultFrag);
        const vert = loadShader(gl, gl.VERTEX_SHADER, vertSrc || defaultVert);
        if (!(vert && frag)) return false
        const program = gl.createProgram();
        if (!program) {
            console.error(`can't create shader program from ${programName}`);
            return false;
        }
        this.frag = frag;
        this.vert = vert;
        this.program = program;
        gl.attachShader(this.program, vert);
        gl.attachShader(this.program, frag);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(
                "Couldn't init shader program: " + gl.getProgramInfoLog(program)
            );
            return false;
        }
        gl.useProgram(program);
        // Setting up engine wide attribs and uniforms.
        this.position = gl.getAttribLocation(program, 'position');
        this.uv = gl.getAttribLocation(program, 'uv');
        this.colour = gl.getAttribLocation(program, 'colour');
        this.gl.enableVertexAttribArray(this.position);
        this.gl.enableVertexAttribArray(this.uv);
        this.gl.enableVertexAttribArray(this.colour);
        this.invCanvas = gl.getUniformLocation(program, 'canvasInv');
        this.time = gl.getUniformLocation(program, 'time');
        if (this.invCanvas) {
            gl.uniform2f(
                this.invCanvas,
                1 / gl.drawingBufferWidth,
                1 / gl.drawingBufferHeight
            );
        }
        // Setting up samplers and shader specific uniforms.
        for (const name of samplers) {
            const sampler = gl.getUniformLocation(program, name);
            const invSize = gl.getUniformLocation(program, `${name}Inv`);
            if (!sampler) console.error(`${programName} lacks uniform ${name}`);
            if (!invSize) {
                console.error(`${programName} lacks uniform ${name}Inv`);
            }
            this.samplers.push({
                sampler: sampler,
                invSize: invSize
            });
        }
        for (const name of extras) {
            const uniform = gl.getUniformLocation(program, name);
            if (!uniform) console.error(`${programName} lacks uniform ${name}`);
            this.extras[name] = uniform;
        }
        this.initialised = true;
        return true;
    }

    /**
     * Sets the value of an extra shader param that is a float.
     * @param name name of the extra to update.
     * @param value value to give it.
     */
    extra1f(name: string, value: number): void {
        this.gl.useProgram(this.program);
        if (!(name in this.extras)) {
            console.error(`shader doesn't have extra ${name}`);
            return;
        }
        this.gl.uniform1f(this.extras[name], value);
    }

    /**
     * Tells the shader the time so it can use it.
     * @param time is the elapsed time of the game.
     */
    update(time: number): void {
        // TODO: guess this should maybe also handle screen size changes if I
        //       ever add that as a feature.
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.time, time);
    }

    draw(item: Drawable): void {
        this.gl.useProgram(this.program);
        const n = item.predraw();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, item.vertices);
        this.gl.vertexAttribPointer(this.position, 2, this.gl.SHORT, false, 0, 0);
        if (item.uvs) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, item.uvs);
            this.gl.vertexAttribPointer(this.uv, 2, this.gl.SHORT, false, 0, 0);
        }
        if (item.colours) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, item.colours);
            this.gl.vertexAttribPointer(this.colour, 4, this.gl.UNSIGNED_BYTE, true, 0, 0);
        }
        if (item.textures) {
            for (
                let i = 0;
                i < Math.min(this.samplers.length, item.textures.length);
                i++
            ) {
                this.gl.activeTexture(this.gl.TEXTURE0 + i);
                item.textures[i].bind();
                if (this.samplers[i].sampler) {
                    this.gl.uniform1i(this.samplers[i].sampler, i)
                }
                if (this.samplers[i].invSize) {
                    this.gl.uniform2f(
                        this.samplers[i].invSize,
                        item.textures[i].getInvWidth(),
                        item.textures[i].getInvHeight()
                    );
                }
            }
        }
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
    }

    /**
     * Creates a shader by passing in it's source code and stuff, or leaving
     * default for the default shader.
     * @param gl gl rendering context.
     * @param fragSrc source code of fragment shader.
     * @param vertSrc source code of vertex shader.
     * @param samplers list of sampler names this shader uses.
     * @param extras list of extra uniforms this shader uses.
     * @returns promising resolving to shader or rejecting on error.
     */
    static createFromSources(
        gl: WebGLRenderingContext,
        fragSrc: string|null = null,
        vertSrc: string|null = null,
        samplers: string[] = ['texture'],
        extras: string[] = []
    ): Promise<Shader> {
        return new Promise(async (resolve, reject) => {

        });
    }

    static createFromJson(
        gl: WebGLRenderingContext,
        url: string
    ): Promise<Shader> {
        return new Promise(async (resolve, reject) => {


        });
    }
}
