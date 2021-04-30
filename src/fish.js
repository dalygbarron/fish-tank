var fish = fish || {};

/**
 * Real function that starts the application running. Just takes all of the
 * subsystems like graphics and audio rather than building them, so that you
 * can create different ones to your heart's content.
 * @param rate     is the number of logic frames per second to aim for. If you
 *                 give a number less than 1 you are asking for variable frame
 *                 rate.
 * @param graphics is the graphics system.
 * @param audio    is the audio system.
 * @param input    is the input system.
 * @param store    is the asset store system.
 * @param init     is the initialisation function that generates the starting
 *                 screen.
 */
fish.start = async function (rate, graphics, audio, input, store, init) {
    const FRAME_LENGTH = 1 / rate;
    let cont = {
        graphics: graphics,
        audio: audio,
        input: input,
        store: store
    };
    let screen = await init(cont);
    if (screen == null) {
        console.err("No Starting Screen. Game Cannot Start.");
        return;
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
            graphics.clear(0, 0, 0, 1);
            for (screen of screens) {
                screen.render(graphics);
            }
        }
    }, 20);
};


/**
 * Starts the thing's main loop ticking along by passing to it the rendering
 * canvas, and the starting screen.
 * @param rate         is the number of logic frames per second to aim for. If
 *                     you give a number less than 1 you are asking for
 *                     variable frame rate.
 * @param gl           is a html canvas.
 * @param audio        is the audio context.
 * @param assetsPrefix is the prefix under which assets are found by the assets
 *                     store.
 * @param init         is a function to generate the starting screen.
 */
fish.normalStart = async function (rate, gl, audio, assetsPrefix, init) {
    let graphics = new fish.graphics.SpriteRenderer(gl);
    let fishAudio = new fish.audio.BasicAudio(audio);
    await fish.start(
        rate,
        graphics,
        fishAudio,
        new fish.Input(),
        new fish.Store(graphics, fishAudio, assetsPrefix),
        init
    );
};
