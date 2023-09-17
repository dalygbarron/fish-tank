import Texture from './Texture';
import * as util from './util';

const defaultVert = `
attribute vec2 position;
attribute vec2 uv;
uniform vec2 canvasInv;
uniform vec2 textureInv;
uniform vec2 critterInv;
varying highp vec2 vTextureCoord;
varying highp vec2 vCritterCoord;
varying highp vec2 vPosition;
void main() {
    gl_Position = vec4(position * canvasInv * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);
    vTextureCoord = uv * textureInv;
    vCritterCoord = uv * critterInv;
    vPosition = position;
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
export abstract class Drawable extends util.Initialised {
    protected gl: WebGLRenderingContext;

    /**
     * Gives you all the drawable's textures. This should probably only be
     * called by Shader but I have no control over that so whatever.
     * @returns array of all textures associated with this drawable.
     */
    abstract getTextures(): Texture[];

    /**
     * Gives you the drawable's buffer of vertices for rendering.
     * @returns buffer of vertices.
     */
    abstract getVertexBuffer(): WebGLBuffer;

    /**
     * Gives you the drawable's buffer of uv mapping data for rendering.
     * @returns the buffer of uv positions.
     */
    abstract getUVBuffer(): WebGLBuffer;

    /**
     * Called immediately before the drawable is rendered and allows it to
     * update it's buffers or whatever.
     * @returns the number of vertices to be drawn.
     */
    abstract draw(): number;
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
    private samplers: {
        sampler: WebGLUniformLocation|null,
        invSize: WebGLUniformLocation|null
    }[] = [];
    private extras: {[id: string]: WebGLUniformLocation|null} = {};

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
        this.gl.enableVertexAttribArray(this.position);
        this.gl.enableVertexAttribArray(this.uv);
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

    bind(): boolean {
        if (this.ready()) {
            this.gl.useProgram(this.program);
            return true;
        }
        console.error('trying to bind uninitialised shader');
        return false;
    }

    /**
     * Sets the value of an extra shader param that is a float.
     * @param name name of the extra to update.
     * @param value value to give it.
     */
    extra1f(name: string, value: number): void {
        if (!this.bind()) return;
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
        if (!this.bind()) return;
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.time, time);
    }

    draw(item: Drawable): void {
        if (!this.ready()) {
            console.error('Trying to draw with uninitialised shader');
            return;
        }
        this.gl.useProgram(this.program);
        const n = item.draw();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, item.getVertexBuffer());
        this.gl.vertexAttribPointer(this.position, 2, this.gl.FLOAT, false, 0, 0);
        //this.gl.enableVertexAttribArray(this.position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, item.getUVBuffer());
        this.gl.vertexAttribPointer(this.uv, 2, this.gl.FLOAT, false, 0, 0);
        //this.gl.enableVertexAttribArray(this.uv);
        const textures = item.getTextures();
        for (
            let i = 0;
            i < Math.min(this.samplers.length, textures.length);
            i++
        ) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            textures[i].bind();
            if (this.samplers[i].sampler) {
                this.gl.uniform1i(this.samplers[i].sampler, i)
            }
            if (this.samplers[i].invSize) {
                this.gl.uniform2f(
                    this.samplers[i].invSize,
                    textures[i].getInvWidth(),
                    textures[i].getInvHeight()
                );
            }
        }
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
    }
}