const defaultVertexShader = `
attribute vec4 position;
uniform mat4 uModelView
uniform mat4 uProjection
void main() {
    gl_Position = uProjection * uModelView * position;
}`;

const defaultFragmentShader = `
void main() {
    gl_FragColor = vec4(1.0, 0.7, 0.3, 1.0);
}`;

function loadShader(gl, type, source) {

}

/**
 * Creates a shader program out of the source of a vertex and fragment shader.
 * @param gl          is the opengl context.
 * @param fragmentSrc is the source of the fragment shader which when null uses
 *                    a default one.
 * @param vertexSrc   is the source of the vertex shader which when null uses
 *                    a default one.
 * @return the new shader program or null if it failed.
 */
function initShaderProgram(gl, vertexSrc=null, fragmentSrc=null) {
    const vertex = loadShader(
        gl,
        gl.VERTEX_SHADER,
        vertexSrc ?: defaultVertexShader
    );
    const fragment = loadShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentSrc ?: defaultFragmentShader
    );
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.err(
            'Could not init shader program: ' + gl.getProgramInfoLog(program)
        );
        return null;
    }
    return program;
};
