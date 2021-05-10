/** @namespace */
var fish = fish || {};

/**
 * Init callback which creates the game's starting screen.
 * @callback fish~init
 * @param {Object} ctx is the game context with all the subsystems and stuff.
 * @return {fish.screen.Screen} the screen created.
 */

/**
 * Real function that starts the application running. Just takes all of the
 * subsystems like graphics and audio rather than building them, so that you
 * can create different ones to your heart's content.
 * @param rate     is the number of logic frames per second to aim for. If you
 *                 give a number less than 1 you are asking for variable frame
 *                 rate.
 * @param graphics    is the graphics system.
 * @param audio       is the audio system.
 * @param input       is the input system.
 * @param store       is the asset store system.
 * @param {fish~init} init is the initialisation function that generates the
 *                    starting screen.
 */
fish.start = async function (rate, graphics, audio, input, store, init) {
    const FRAME_LENGTH = 1 / rate;
    let ctx = {
        gfx: graphics,
        snd: audio,
        in: input,
        str: store
    };
    let screen = await init(ctx);
    if (screen == null) {
        console.err("No Starting Screen. Game Cannot Start.");
        return;
    }
    let screens = [screen];
    screen.refresh();
    const updateScreens = () => {
        const response = screens[screens.length - 1].update(FRAME_LENGTH);
        if (response) {
            if (response.pop) screens.pop();
            if (response.screen) screens.push(response.screen);
            screens[screens.length - 1].refresh(response.message);
        }
    };
    setInterval(() => {
        if (screens.length > 0) {
            // TODO: calculate the passage of time better and desync rendering
            // with updating.
            ctx.snd.update();
            ctx.in.update();
            updateScreens();
            ctx.gfx.clear(0, 0, 0, 1);
            for (screen of screens) {
                screen.render();
            }
        }
    }, FRAME_LENGTH);
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
 * @param {fish~init} init         is a function to generate the starting screen.
 */
fish.normalStart = async function (rate, gl, audio, assetsPrefix, init) {
    let graphics = new fish.graphics.SpriteRenderer(gl);
    let fishAudio = new fish.audio.BasicAudio(audio);
    await fish.start(
        rate,
        graphics,
        fishAudio,
        new fish.input.BasicInput(),
        new fish.Store(graphics, fishAudio, assetsPrefix),
        init
    );
};
