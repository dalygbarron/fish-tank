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
 * @param {number} rate is the frame rate to give the game. If you pass
 *        something less than or equal to zero then it makes it variable.
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

(() => {
    /**
     * Screen that waits asynchronously for a new screen to be created and then
     * switches to it. You can also do whatever you want during that time
     * including loading whatever stuff you want asynchronously.
     */
    class InitScreen extends fish.screen.Screen {
        /**
         * @param {fish.screen.Context} ctx engine context.
         * @param {fish~init} init function producing the screen that appears
         *        after this one.
         */
        constructor(ctx, init) {
            super(ctx);
            this.next = null;
            Promise.resolve(init(ctx)).then(value => {
                this.next = value;
            });
        }

        /** @inheritDoc */
        update(delta) {
            if (this.next) {
                return new fish.screen.Transition(true, this.next);
            }
            return null;
        }

        /** @inheritDoc */
        render(front) {
            this.ctx.gfx.clear(0, 0, 0, 1);
        }
    }

    /**
     * Like the init screen but displays some cool stuff and does not return to
     * the new screen until it has run for 7 seconds or so no matter what.
     */
    class FancyInitScreen extends InitScreen {
        /**
         * @param {fish.screen.Context} ctx engine context.
         * @param {fish~init} init creates the start of the game proper.
         */
        constructor(ctx, init, texture, atlas, sound) {
            super(ctx, init);
            this.texture = texture;
            this.atlas = atlas;
            this.sound = sound;
            this.timer = 7;
            this.batch = new ctx.gfx.Batch(texture, 256);
            console.log(this.sound);
        }

        /** @inheritDoc */
        refresh() {
            this.ctx.snd.playSample(this.sound[0]);
        }

        /** @inheritDoc */
        update(delta) {
            this.timer -= delta;
            if (this.timer <= 0) return super.update(delta);
            return null;
        }

        /** @inheritDoc */
        render(front) {
            this.ctx.gfx.clear(1, 0, 0, 1);
        }
    }

    /**
     * Creates the game engine context which contains all the subsystems and is
     * given to all the screens.
     * @param {fish.start~Args} args contains all the details of how to
     *        set up the engine. If there are invalidities with the settings in
     *        this object an exception will be thrown containing a readable
     *        error message.
     * @return {fish.screen.Context} created according to the args.
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
        const FRAME_LENGTH = 1 / (args.rate ? args.rate : 1);
        let ctx = null;
        try {
            ctx = createContext(args);
        } catch (err) {
            alert(err + err.stack ? err.stack : '');
            throw err;
        }
        let screen = new InitScreen(ctx, async function (ctx) {
            let sample = await Promise.all([
                //ctx.gfx.loadTexture('https://github.com/dalygbarron/fish-tank/raw/master/test/sprites.png'),
                //fish.graphics.loadAtlas('https://raw.githubusercontent.com/dalygbarron/fish-tank/master/test/sprites.json'),
                ctx.snd.makeSample(fish.constants.JINGLE)
            ]);
            return new FancyInitScreen(ctx, init, null, null, sample);
        });
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
                for (let i in screens) {
                    screens[i].render(i == screens.length - 1);
                }
            }
        }, FRAME_LENGTH);
    };
})();
