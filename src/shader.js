const defaultVertexShader = `
attribute vec4 position;
attribute vec4 textureCoord;
uniform vec4 canvas;
varying highp vec2 vTextureCoord;
void main() {
    gl_Position = position / (canvas * vec4(0.5, 0.5, 1.0, 1.0)) - vec4(1.0, 1.0, 0, 0);
    vTextureCoord = textureCoord.xy / canvas.xy;
}`;

const defaultFragmentShader = `
uniform sampler2D sampler;
varying highp vec2 vTextureCoord;
void main() {
    gl_FragColor = texture2D(sampler, vTextureCoord);
}`;

let defaultShader = null;

/**
 * Loads a shader from text source.
 * @param gl     is the opengl context.
 * @param type   is the type of shader to load.
 * @param source is the text source code.
 * @return the created shader or null if it screwed up.
 */
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
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    gl.useProgram(program);
    const canvas = gl.getUniformLocation(program, 'canvas');
    gl.uniform4f(canvas, width, height, 1, 1);
    return {
        program: program,
        position: gl.getAttribLocation(program, 'position'),
        textureCoord: gl.getAttribLocation(program, 'textureCoord'),
        canvas: canvas,
        sampler: gl.getUniformLocation(program, 'sampler')
    };
}

/**
 * Binds the default shader for some nice default rendering.
 * @param gl is the opengl context.
 */
function bindDefaultShader(gl) {
    if (defaultShader == null) {
        defaultShader = createShaderProgram(gl);
    }
    gl.useProgram(defaultShader.program);
    return defaultShader;
}

/**
 * Creates a texture batcher which one may use to draw cool stuff. You need to
 * call it's clear function every frame so that it does not draw stuff from
 * last frame again. If you try that it will do nothign and complain.
 * @param gl  is the opengl context which is used to do stuff.
 * @param max is the maximum number of sprites the batch may draw per frame.
 */
function createBatch(gl, texture, max) {
    let items = new Float32Array(max * 12);
    let textureItems = new Float32Array(max * 12);
    let n = 0;
    let rendered = false;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        items,
        gl.DYNAMIC_DRAW
    );
    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureItems, gl.DYNAMIC_DRAW);
    return {
        add: (src, dst) => {
            if (n >= max) return;
            items[n * 12] = dst.x;
            items[n * 12 + 1] = dst.y;
            items[n * 12 + 2] = dst.x + dst.w;
            items[n * 12 + 3] = dst.y;
            items[n * 12 + 4] = dst.x;
            items[n * 12 + 5] = dst.y + dst.h;
            items[n * 12 + 6] = dst.x + dst.w;
            items[n * 12 + 7] = dst.y;
            items[n * 12 + 8] = dst.x + dst.w;
            items[n * 12 + 9] = dst.y + dst.h;
            items[n * 12 + 10] = dst.x;
            items[n * 12 + 11] = dst.y + dst.h;
            textureItems[n * 12] = src.x;
            textureItems[n * 12 + 1] = src.y;
            textureItems[n * 12 + 2] = src.x + src.w;
            textureItems[n * 12 + 3] = src.y;
            textureItems[n * 12 + 4] = src.x;
            textureItems[n * 12 + 5] = src.y + src.h;
            textureItems[n * 12 + 6] = src.x + src.w;
            textureItems[n * 12 + 7] = src.y;
            textureItems[n * 12 + 8] = src.x + src.w;
            textureItems[n * 12 + 9] = src.y + src.h;
            textureItems[n * 12 + 10] = src.x;
            textureItems[n * 12 + 11] = src.y + src.h;
            n++;
        },
        clear: () => {
            rendered = false;
            n = 0;
        },
        render: () => {
            if (rendered) {
                console.error('repeat batch rendering without clear');
                return;
            }
            rendered = true;
            let shader = bindDefaultShader(gl);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, items);
            gl.vertexAttribPointer(shader.position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, textureItems);
            gl.vertexAttribPointer(shader.textureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.textureCoord);
            // TODO: use different texture slots to save time when using
            //       more than one texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(shader.sampler, 0);
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
        }
    };
}
