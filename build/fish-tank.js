class Colour {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    wrap(bounds) {
        while (this.x < bounds.pos.x) this.x += bounds.size.x;
        while (this.y < bounds.pos.y) this.y += bounds.size.y;
        while (this.x >= bounds.pos.x + bounds.size.x) this.x -= bounds.size.x;
        while (this.y >= bounds.pos.y + bounds.size.y) this.y -= bounds.size.y;
    }
}

class Rect {
    constructor(x, y, w, h) {
        this.pos = new Vector(x, y);
        this.size = new Vector(w, h);
    }

    get x() {
        return this.pos.x;
    }

    get y() {
        return this.pos.y;
    }

    get w() {
        return this.size.x;
    }

    get h() {
        return this.size.y;
    }

    get r() {
        return this.pos.x + this.size.x;
    }

    get b() {
        return this.pos.y + this.size.y;
    }
}

class Texture {
    constructor(glTexture, width, height) {
        this.glTexture = glTexture;
        this.width = width;
        this.height = height;
    }
}

/**
 * Asynchronously loads a texture out of a url. I made it asynchronous because
 * returning a test image would work quite poorly with texture atlases, and it
 * will also fuck up with other data types so we need to implement asynchronous
 * loading.
 * @param gl  is the opengl context for doing texture stuff.
 * @param url is the url to load the texture from.
 * @return the texture.
 */
async function loadTexture(gl, url) {
    return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            resolve(new Texture(texture, image.width, image.height));
        };
        image.src = url;
    });
}

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
            const offset = n * 12;
            items[offset] = dst.x;
            items[offset + 1] = dst.y;
            items[offset + 2] = dst.r;
            items[offset + 3] = dst.y;
            items[offset + 4] = dst.x;
            items[offset + 5] = dst.b;
            items[offset + 6] = dst.r;
            items[offset + 7] = dst.y;
            items[offset + 8] = dst.r;
            items[offset + 9] = dst.b;
            items[offset + 10] = dst.x;
            items[offset + 11] = dst.b;
            textureItems[offset] = src.x;
            textureItems[offset + 1] = src.y;
            textureItems[offset + 2] = src.r;
            textureItems[offset + 3] = src.y;
            textureItems[offset + 4] = src.x;
            textureItems[offset + 5] = src.b;
            textureItems[offset + 6] = src.r;
            textureItems[offset + 7] = src.y;
            textureItems[offset + 8] = src.r;
            textureItems[offset + 9] = src.b;
            textureItems[offset + 10] = src.x;
            textureItems[offset + 11] = src.b;
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
            gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
            gl.uniform1i(shader.sampler, 0);
            gl.uniform2f(shader.invTextureSize, 1 / texture.width, 1 / texture.height);
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
        }
    };
}

/**
 * Creates a screen object by taking the four things a screen needs.
 * @param input    is a function called when input is received, which returns
 *                 a boolean telling you whether the input was used.
 * @param update   is an instantiated coroutine which can assume to be called 60
 *                 times per second, and yields/returns other screens that it can
 *                 assume will be placed on top of the screen stack. If it
 *                 returns, it can assume itself to be removed from the stack,
 *                 which happens before any are added.
 * @param render   just renders the screen and is called whenever.
 * @param evaluate returns a value that can be passed to a screen below when
 *                 this one's update coroutine has ended. It doesn't need to
 *                 be able to return a valid value until the update thing has
 *                 ended.
 * @return the newly created screen object.
 */
function createScreen(input, update, render, evaluate) {
    return {
        input: input,
        update: update,
        render: render,
        evaluate: evaluate
    };
}

/**
 * Creates a screen that only updates and renders, absorbs all input without
 * using it, and evaluates to nothing when completed.
 * @param update is the update coroutine.
 * @param render is the render function.
 * @return the new screen.
 */
function createDullScreen(update, render) {
    return createScreen(
        (key) => {return true;},
        update,
        render,
        () => {return null;}
    );
}

/**
 * Takes a bunch of promises and waits for them all to load while showing some
 * junk on the screen to keep the kids entertained.
 * @param promises is the lot of promises.
 * @return the loading screen.
 */
function createLoadScreen(after, ...promises) {
    let newScreen = null;
    Promise.all(promises).then((v) => {
        newScreen = after(...v);
    });
    return createDullScreen(
        (function* () {
            while (!newScreen) yield;
            return newScreen;
        })(),
        (gl, x, y, w, h) => {
            gl.clearColor(Math.random(), Math.random(), Math.random(), 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    );
}

/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param canvas is a html canvas.
 * @param screen is the first screen to place on the screen stack.
 */
function start(gl, screen) {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    screens = [screen];
    const updateScreens = (message=null) => {
        const response = screens[screens.length - 1].update.next(message);
        if (response.done) {
            const evaluation = screens[screens.length - 1].evaluate();
            screens.pop();
            if (screens.length > 0) updateScreens(evaluation);
        }
        if (response.value) {
            screens.push(response.value);
        }
    };
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    setInterval(() => {
        if (screens.length > 0) {
            // TODO: inputs.
            // TODO: calculate the passage of time.
            updateScreens();
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            for (screen of screens) {
                screen.render(gl, 0, 0, width, height);
            }
        }
    }, 20);
}
