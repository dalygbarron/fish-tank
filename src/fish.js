var fish = fish || {};

/**
 * Real function that starts the application running. Just takes all of the
 * sybsystems like graphics and audio rather than building them, so that you
 * can create different ones to your heart's content.
 * @param graphics is the graphics system.
 * @param audio    is the audio system.
 * @param input    is the input system.
 * @param store    is the asset store system.
 * @param init     is the initialisation function that generates the starting
 *                 screen.
 */
fish.start = async function (graphics, audio, input, store, init) {
    let cont = {
        graphics: graphics,
        audio: fishAudio,
        input: input,
        store: new fish.Store(graphics, fishAudio, '')
    };
    let screen = await init(cont);
    if (screen == null) {
        console.err("No Starting Screen. Game Cannot Start.");
    }
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
            // TODO: calculate the passage of time.
            cont.audio.update();
            cont.input.update();
            updateScreens();
            graphics.clear(graphics.BLACK);
            for (screen of screens) {
                screen.render(graphics);
            }
        }
    }, 20);
};


/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param gl           is a html canvas.
 * @param audio        is the audio context.
 * @param assetsPrefix is the prefix under which assets are found by the assets
 *                     store.
 * @param init         is a function to generate the starting screen.
 */
fish.normalStart = async function (gl, audio, assetsPrefix, init) {
    let graphics = new fish.Graphics(gl);
    let fishAudio = new fish.Audio(audio);
    await fish.start(
        graphics,
        fishAudio,
        new fish.Input(),
        new fish.Store(graphics, fishAudio, assetsPrefix),
        init
    );
};
