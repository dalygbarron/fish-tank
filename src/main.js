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
