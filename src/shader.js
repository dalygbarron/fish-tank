const defaultVertexShader = `
attribute vec4 position;
void main() {
    gl_Position = position;
}`;

const defaultFragmentShader = `
void main() {
    gl_FragColor = vec4(mod(gl_FragCoord.x, 1.0), mod(gl_FragCoord.y, 1.0), 0.3, 1.0);
}`;

function loadShader(gl, type, source) {
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
function createShaderProgram(gl, vertexSrc=null, fragmentSrc=null) {
    const vertex = loadShader(
        gl,
        gl.VERTEX_SHADER,
        vertexSrc ? vertexSrc : defaultVertexShader
    );
    const fragment = loadShader(
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
            'Could not init shader program: ' + gl.getProgramInfoLog(program)
        );
        return null;
    }
    return {
        program: program,
        attribLocations: {
            position: gl.getAttribLocation(program, 'position')
        },
        uniformLocations: {
            projection: gl.getUniformLocation(program, 'uProjection'),
            modelView: gl.getUniformLocation(program, 'uModelView')
        }
    };
}

function createBuffer(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1, 1,
        1, 1,
        -1, -1,
        1, -1
    ];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );
    return {
        position: positionBuffer
    };
}
