var fish = fish || {};

fish.shader = (() => {
    const defaultVertexShader = `
    attribute vec4 position;
    attribute vec4 textureCoord;
    uniform vec4 invCanvas;
    uniform vec2 invTextureSize;
    varying highp vec2 vTextureCoord;
    void main() {
        gl_Position = position * (invCanvas * vec4(2, 2, 1.0, 1.0)) - vec4(1.0, 1.0, 0, 0);
        vTextureCoord = textureCoord.xy * invTextureSize;
    }`;

    const defaultFragmentShader = `
    uniform sampler2D sampler;
    varying highp vec2 vTextureCoord;
    void main() {
        gl_FragColor = texture2D(sampler, vTextureCoord);
    }`;

    let defaultShader = null;
    let shader = {};
    
    /**
     * Loads a shader from text source.
     * @param gl     is the opengl context.
     * @param type   is the type of shader to load.
     * @param source is the text source code.
     * @return the created shader or null if it screwed up.
     */
     shader.loadShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                'Could not compiler shader: ' + gl.getShaderInfoLog(shader)
            );
            return null;
        }
        return shader;
    };

    /**
     * Creates a shader out of the source of a vertex and fragment shader.
     * @param gl          is the opengl context.
     * @param fragmentSrc is the source of the fragment shader which when null
     *                    uses a default one.
     * @param vertexSrc   is the source of the vertex shader which when null
     *                    uses a default one.
     * @return the new shader program or null if it failed.
     */
    shader.createShaderProgram = (gl, vertexSrc=null, fragmentSrc=null) => {
        const vertex = shader.loadShader(
            gl,
            gl.VERTEX_SHADER,
            vertexSrc ? vertexSrc : defaultVertexShader
        );
        const fragment = shader.loadShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentSrc ? fragmentSrc : defaultFragmentShader
        );
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(
                'Could not init shader program: ' +
                    gl.getProgramInfoLog(program)
            );
            return null;
        }
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        gl.useProgram(program);
        const invCanvas = gl.getUniformLocation(program, 'invCanvas');
        gl.uniform4f(invCanvas, 1 / width, 1 / height, 1, 1);
        return {
            program: program,
            position: gl.getAttribLocation(program, 'position'),
            textureCoord: gl.getAttribLocation(program, 'textureCoord'),
            invTextureSize: gl.getUniformLocation(program, 'invTextureSize'),
            invCanvas: invCanvas,
            sampler: gl.getUniformLocation(program, 'sampler')
        };
    };

    /**
     * Binds the default shader for some nice default rendering.
     * @param gl is the opengl context.
     */
    shader.bindDefaultShader = (gl) => {
        if (defaultShader == null) {
            defaultShader = shader.createShaderProgram(gl);
        }
        gl.useProgram(defaultShader.program);
        return defaultShader;
    };

    return shader;
})();
