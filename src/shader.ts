import Texture from './Texture';
import * as util from './util';

const defaultVert = `
attribute vec4 position;
attribute vec4 uv;
uniform vec4 invCanvas;
uniform vec2 textureInv;
varying highp vec2 vTextureCoord;
void main() {
    gl_Position = position * (invCanvas * vec4(2, 2, 1.0, 1.0)) -
        vec4(1.0, 1.0, 0, 0);
    vTextureCoord = uv.xy * textureInv;
}`;

const defaultFrag = `
uniform sampler2D texture;
varying highp vec2 vTextureCoord;
void main() {
    gl_FragColor = texture2D(texture, vTextureCoord);
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
 * Something that can be drawn by a shader. The reason we use shaders as the
 * class that handles rendering is that they have information about texture
 * names that is useful, also it makes keeping track of what shader is for what
 * feel more natural in my humble opinion.
 */
export class Drawable {
    private textures: Texture[];
    protected gl: WebGLRenderingContext|null = null;
}

/**
 * Stores a shader program and associated info.
 */
export default class Shader extends util.Initialised {
    private gl: WebGLRenderingContext;
    private vert: WebGLShader;
    private frag: WebGLShader;
    private program: WebGLProgram;
    private position: number;
    private uv: number;
    private invCanvas: WebGLUniformLocation|null;
    private time: WebGLUniformLocation|null;
    private samplers: {[id: string]: {
        sampler: WebGLUniformLocation|null,
        invSize: WebGLUniformLocation|null
    }};
    private extras: {[id: string]: WebGLUniformLocation|null};

    /**
     * Frees the shader's resources and lets you use it for something else.
     * @param gl webgl context for getting at the resources.
     */
    free(): void {
        if (!this.ready()) return;
        this.gl.deleteProgram(this.program);
        this.gl.deleteShader(this.frag);
        this.gl.deleteShader(this.vert);
        this.initialised = false;
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
        let fragName = fragSrc ? fragSrc : 'defaultFrag';
        let vertName = vertSrc ? vertSrc : 'defaultVert';
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
        this.invCanvas = gl.getUniformLocation(program, 'canvasInv');
        this.time = gl.getUniformLocation(program, 'time');
        if (this.invCanvas) {
            gl.uniform4f(
                this.invCanvas,
                1 / gl.drawingBufferWidth,
                1 / gl.drawingBufferHeight,
                1,
                1
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
            this.samplers[name] = {
                sampler: sampler,
                invSize: invSize
            };
        }
        for (const name of extras) {
            const uniform = gl.getUniformLocation(program, name);
            if (!uniform) console.error(`${programName} lacks uniform ${name}`);
            this.extras[name] = uniform;
        }
        this.initialised = true;
        return true;
    }

    bind(): void {
        if (this.ready()) this.gl.useProgram(this.program);
        else console.error('trying to bind uninitialised shader');
    }

    draw(item: Drawable): void {

    }
};