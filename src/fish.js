/** @namespace */
var fish = fish || {};

/**
 * Init callback which creates the game's starting screen.
 * @callback fish~init
 * @param {fish.screen.Context} ctx is the game context with all the subsystems
 *        and stuff.
 * @return {Promise<fish.screen.Screen>} the screen created.
 */

/**
 * The format of the argument object to fish.start. For most of the subsystems
 * you have the choice of either passing an options object or an instance,
 * basically if you are using the default subsystem you pass options or
 * nothing, and if you want to use a custom subsystem you pass the instance of
 * it which you have already set up.
 * @typedef {Object} fish.start~Args
 * @param {number} rate is the logical frame rate to give the game. If this is
 *        not given it defaults to 30.
 * @param {Object} usr copied to game context usr object.
 * @param {?fish.graphics.PatchRenderer} gfx graphics system to use if given.
 * @param {?fish.audio.SamplePlayer} snd sound system to use if given.
 * @param {?fish.input.UiInput} in input system to use if given
 * @param {?Object} str store the asset store object or nothing for default.
 * @param {?WebGLRenderingContext} gl the webgl rendering context for the
 *        default renderer. It is not needed if you passed a renderer.
 * @param {?AudioContext} ac the audio context needed to create the default
 *        sound player. If you have passed a sound player it is not needed or
 *        used.
 * @param {?number} nSamples the number of times the same sample can be playing
 *        at once in the default sound player.
 * @param {?Object} keymap is the mapping of keys to the default input's input.
 * @param {?number} axisThreshold is the threshold for the default input to
 *        detect axes being depressed.
 * @param {?string} assetPrefix is the prefix to prepend to the names of all
 *        things you try to load through the default store.
 */

/**
 * The levels of compatability a subsystem can have with the browser the game
 * is running in. Remember that subsystems should not crash the game even if
 * they have no compatability.
 * @readonly
 * @enum {string}
 */
fish.COMPATABILITY_LEVEL = {
    /** Full compatability. Everything is fine. */
    FULL: 'FULL',
    /**
     * Partial compatability. All base interface responsibilities can be
     * fulfilled, but some other features don't work properly. Usual functions
     * should still exist and not throw exceptions though because otherwise the
     * game is just gonna crash anyway.
     */
    PARTIAL: 'PARTIAL',
    /**
     * Compatability is not high enough for subsystem to fulfill the features
     * of it's basic interface.
     */
    NONE: 'NONE'
};

/**
 * Format of a compatibility indicator object that comes from the subsystems to
 * tell you what level of compatibility they have to the current system.
 * Subsystems should never crash the game even if they are completely
 * incompatible.
 */
fish.Compatability = class {
    /**
     * @param {fish.COMPATABILITY_LEVEL} level the actual level of
     *        compatibility. If this is no compatability then the game should
     *        not start.
     * @param {string} message message which tells you what is up with
     *        compatibility. If the system is fully compatible this doesn't
     *        matter that much but it's reasonably important when it's fucked.
     */
    constructor(level, message) {
        this.level = level;
        this.message = message;
    }
};

(() => {
    /**
     * Creates the game engine context which contains all the subsystems and is
     * given to all the screens.
     * @param {fish.start~Args} args contains all the details of how to
     *        set up the engine. If there are invalidities with the settings in
     *        this object an exception will be thrown containing a readable
     *        error message.
     * @return {Promise<fish.screen.Context>} created according to the args.
     */
    let createContext = args => {
        let gfx = args.gfx;
        let snd = args.snd;
        let input = args.in;
        let loaders = args.loaders ? args.loaders : {};
        if (!gfx) {
            let gl = args.gl;
            if (!gl) {
                throw new RuntimeError(
                    'In order to use the default renderer, gl argument ' +
                    'must be provided'
                );
            }
            gfx = new fish.graphics.SpriteRenderer(gl);
            if (!loaders.texture) {
                loaders.texture = gfx.loadTexture;
            }
            if (!loaders.atlas) {
                loaders.atlas = fish.graphics.loadAtlas;
            }
        }
        if (!snd) {
            let ac = args.ac;
            if (!ac) {
                throw new RuntimeError(
                    'In order to use the default sound player, ac ' +
                    'argument must be provided'
                );
            }
            snd = new fish.audio.BasicAudio(
                ac,
                args.nSamples ? args.nSamples : 2
            );
            if (!loaders.sample) {
                loaders.sample = snd.loadSample;
            }
        }
        if (!input) {
            let keymap = args.keymap ? args.keymap : {};
            let threshold = args.axisThreshold ? args.axisThreshold : 0.9;
            input = new fish.input.BasicInput(keymap, threshold);
        }
        let gfxComp = gfx.getCompatability();
        let sndComp = snd.getCompatability();
        let inComp = input.getCompatability();
        if (fish.COMPATABILITY_LEVEL.LOW in
            [gfxComp.level, sndComp.level, inComp.level]
        ) {
            throw new RuntimeError(
                'Browser Compatability is too low to run the game:\n' +
                'graphics: ' + gfxComp.message + '\n' +
                'sound: ' + sndComp.message + '\n' +
                'input: ' + inComp.message
            );
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
     * @param {fish.start~Args} args 
     * @param {fish~init} init initialisation function that generates the first
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
        let screen = ctx.gfx.createSplashScreen(ctx, initScreen);
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
