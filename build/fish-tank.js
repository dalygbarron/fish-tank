
/**
 * Creates an object representing a colour. The numbers should be between 0 and
 * 1, unless you are doing somethign freaky I guess.
 * @param r is red.
 * @param g is green.
 * @param b is blue.
 * @param a is alpha.
 * @return the colour object.
 */
const createColour = function(r, g, b, a) {
    return {r: r, g: g, b: b, a: a};
};


const defaultVertexShader = `
attribute vec4 position;
void main() {
    gl_Position = position / vec4(100.0, 100.0, 100.0, 100.0);
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
const createScreen = (input, update, render, evaluate) => {
    return {
        input: input,
        update: update,
        render: render,
        evaluate: evaluate
    };
};

/**
 * Creates a screen that only updates and renders, absorbs all input without
 * using it, and evaluates to nothing when completed.
 * @param update is the update coroutine.
 * @param render is the render function.
 * @return the new screen.
 */
const createDullScreen = (update, render) => {
    return createScreen(
        (key) => {
            return true;
        },
        update,
        render,
        () => {
            return null;
        }
    );
};


/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param canvas is a html canvas.
 * @param screen is the first screen to place on the screen stack.
 */
function start(canvas, screen) {
    const gl = canvas.getContext('webgl');
    if (gl === null) {
        alert('the police the FBI are coming in your window man');
        return;
    }
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
    setInterval(() => {
        if (screens.length > 0) {
            // TODO: inputs.
            // TODO: calculate the passage of time.
            updateScreens();
            // TODO: make rendering run on requestAnimationFrame time
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            for (screen of screens) {
                screen.render(gl, 0, 0, width, height);
            }
        }
    }, 50);
}
