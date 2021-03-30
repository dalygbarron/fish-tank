var fish = fish || {};

/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param canvas is a html canvas.
 * @param screen is the first screen to place on the screen stack.
 */
fish.start = async function (gl, init) {
    let graphics = new fish.Graphics(gl);
    let cont = {
        graphics: graphics,
        store: new fish.Store(graphics, '')
    };
    let screen = await init(cont);
    if (screen == null) return; // TODO: message
    let screens = [screen];
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
            graphics.clear(graphics.BLACK);
            for (screen of screens) {
                screen.render(graphics);
            }
        }
    }, 20);
};