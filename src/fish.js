var fish = fish || {};

/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param gl    is a html canvas.
 * @param audio is the audio context.
 * @param init  is a function to generate the starting screen.
 */
fish.start = async function (gl, audio, init) {
    let graphics = new fish.Graphics(gl);
    let cont = {
        graphics: graphics,
        store: new fish.Store(graphics, ''),
        audio: new fish.Audio(audio)
    };
    let screen = await init(cont);
    if (screen == null) return; // TODO: message
    let screens = [screen];
    screen.refresh();
    const updateScreens = (message=null) => {
        const response = screens[screens.length - 1].update.next(message);
        if (response.done) {
            const evaluation = screens[screens.length - 1].evaluate();
            screens.pop();
            if (screens.length > 0) {
                screens[screens.length - 1].refresh();
                updateScreens(evaluation);
            }
        }
        if (response.value) {
            screens.push(response.value);
            screens[screens.length - 1].refresh();
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
