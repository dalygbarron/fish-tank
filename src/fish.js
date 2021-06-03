/** @namespace */
var fish = fish || {};

/**
 * Init callback which creates the game's starting screen.
 * @callback fish~Init
 * @param {fish.screen.Context} ctx is the game context with all the subsystems
 *        and stuff.
 * @return {Promise<fish.screen.Screen>} the screen created.
 */

/**
 * The format of the argument object to fish.start.
 * @typedef {Object} fish~StartArgs
 * @property {number} rate is the logical frame rate to give the game. If this
 *           is not given it defaults to 30.
 * @property {Object} usr copied to game context usr object.
 * @property {?fish.graphics.PatchRenderer} gfx graphics system to use if
 *           given.
 * @property {?fish.audio.SamplePlayer} snd sound system to use if given.
 * @property {?fish.input.UiInput} in input system to use if given
 * @property {?Object} str store the asset store object or nothing for default.
 * @property {?WebGLRenderingContext} gl the webgl rendering context for the
 *           default renderer. It is not needed if you passed a renderer.
 * @property {?AudioContext} ac the audio context needed to create the default
 *           sound player. If you have passed a sound player it is not needed
 *           or used.
 * @property {?number} nSamples the number of times the same sample can be
 *           playing at once in the default sound player.
 * @property {?Object} keymap is the mapping of keys to the default input's
 *           input.
 * @property {?number} axisThreshold is the threshold for the default input to
 *           detect axes being depressed.
 * @property {?string} assetPrefix is the prefix to prepend to the names of all
 *           things you try to load through the default store.
 */

(() => {
    /**
     * Creates the game engine context which contains all the subsystems and is
     * given to all the screens.
     * @param {fish~StartArgs} args contains all the details of how to
     *        set up the engine. If there are invalidities with the settings in
     *        this object an exception will be thrown containing a readable
     *        error message.
     * @return {Promise<fish.screen.Context>} created according to the args.
     */
    let createContext = args => {
        let loaders = args.loaders ? args.loaders : {};
        let gl = args.gl;
        let ac = args.ac;
        let keymap = args.keymap ? args.keymap : {};
        let threshold = args.axisThreshold ? args.axisThreshold : 0.9;
        if (!gl) {
            throw new RuntimeError(
                'In order to use the default renderer, gl argument ' +
                'must be provided'
            );
        }
        if (!ac) {
            throw new RuntimeError(
                'In order to use the default sound player, ac ' +
                'argument must be provided'
            );
        }
        gfx = new fish.graphics.Renderer(gl);
        snd = new fish.audio.SoundPlayer(ac);
        input = new fish.input.BasicInput(keymap, threshold);
        if (!loaders.texture) {
            loaders.texture = url => {
                return gfx.loadTexture(url);
            };
        }
        if (!loaders.atlas) {
            loaders.atlas = url => {
                return fish.graphics.loadAtlas(url);
            };
        }
        if (!loaders.sample) {
            loaders.sample = url => {
                return snd.loadSample(url);
            };
        }
        return {
            gfx: gfx,
            snd: snd,
            in: input,
            str: new fish.Store(
                loaders,
                args.storePrefix ? args.storePrefix : '/'
            ),
            usr: args.usr ? args.usr : {}
        };
    };

    /**
     * Real function that starts the application running.
     * @param {fish~StartArgs} args 
     * @param {fish~Init} init initialisation function that generates the first
     *        screen of the game.
     */
    fish.start = async function (args, init) {
        const FRAME_LENGTH = 1 / (args.rate ? args.rate : 30);
        let ctx = null;
        try {
            ctx = createContext(args);
        } catch (err) {
            alert(err + err.stack ? err.stack : '');
            throw err;
        }
        let initScreen = init(ctx);
        let screen = new fish.screen.SplashScreen(ctx, initScreen);
        let screens = [screen];
        let logicInterval;
        let visualInterval;
        screen.refresh();
        const updateScreens = () => {
            if (screens.length == 0) {
                window.clearInterval(logicInterval);
                return;
            }
            const response = screens[screens.length - 1].update(FRAME_LENGTH);
            if (response) {
                if (response.pop) screens.pop();
                if (response.screen) screens.push(response.screen);
                if (screens.length >= 1) {
                    screens[screens.length - 1].refresh(response.message);
                }
            }
        };
        const render = (timestamp) => {
            ctx.gfx.clear(0, 0, 0, 1);
            for (let i in screens) {
                screens[i].render(i == screens.length - 1);
            }
            if (screens.length > 0) window.requestAnimationFrame(render);
        };
        logicInterval = window.setInterval(() => {
            if (screens.length > 0) {
                ctx.snd.update();
                ctx.in.update();
                updateScreens();
            }
        }, FRAME_LENGTH);
        window.requestAnimationFrame(render);
    };
})();
