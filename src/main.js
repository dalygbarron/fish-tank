/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param canvas is a html canvas.
 * @param screen is the first screen to place on the screen stack.
 */
const start = (canvas, screen) => {
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
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            for (screen of screens) {
                screen.render(gl, 0, 0, width, height);
            }
        }
    }, 50);
};

const createFlashScreen = (colour) => {
    const updater = function* () {
        for (let i = 0; i < 20; i++) {
            colour.r = Math.max(0, colour.r - 0.04);
            colour.g = Math.max(0, colour.g - 0.04);
            colour.b = Math.max(0, colour.b - 0.04);
            yield;
        }
    };
    return createDullScreen(
        updater(),
        (gl, x, y, width, height) => {
            gl.clearColor(colour.r, colour.g, colour.b, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    );
};

const createBasedScreen = () => {
    let number = 0;
    return createScreen(
        (key) => {
            console.log('key: '+key);
            return true;
        },
        (function* () {
            for (let i = 0; i < 100; i++) {
                number++;
                let colour = createColour(
                    Math.random(),
                    Math.random(),
                    Math.random(),
                    1
                );
                yield createFlashScreen(colour);
            }
        })(),
        (gl, x, y, width, height) => {
            gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            console.log(number);
        },
        () => {
            return null;
        }
    );
};

const begin = () => {
    start(document.querySelector('#sex-zone'), createBasedScreen());
};

window.onload = begin;
