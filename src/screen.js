var fish = fish || {};

/**
 * Contains the screen class and the context class which holds the subsystem
 * for screens.
 * @namespace
 */
fish.screen = {};

/**
 * Stores all the game's subsystems. Now, you will notice that these are all
 * interface types that the engine provides. You will control what the
 * implementing type is and for god's sake don't try to do any static type
 * crazy bullshit with this. Just accept that the actual implementing types of
 * these are the ones you asked for in your game.
 * These interfaces are just the basic amount of functionality that the engine
 * requires from each subsystem.
 * @typedef {Object} fish.screen~Context
 * @param {fish.graphics.BaseRenderer} gfx the graphics subsystem.
 * @param {fish.audio.SamplePlayer} snd the audio subsystem.
 * @param {fish.input.UiInput} in the input subsystem.
 * @param {fish.store.Store} str the asset store.
 * @param {Object} usr basically a namespace where you can store your own junk
 *        without fear of future versions of the engine overwriting it.
 */

/**
 * Represents a transition between screens on the screen stack.
 */
fish.screen.Transition = class {
    /**
     * There are three different configurations that this constructor allows.
     * When pop is true the current screen is removed, when screen is not null
     * then that screen is placed on the stack. Thus, you can push a screen on
     * this screen, replace this screen with another, or you can just pop this
     * screen. If you set pop to false and screen to null then nothing will
     * happen.
     * @param {boolean} pop whether to pop the returning screen from the screen
     *        stack.
     * @param {?fish.screen.Screen} screen is a screen to add to the screen
     *        stack if given.
     * @param {?Object} message a message that will be given to whatever screen
     *        is going to next have reveal called on it.
     */
    constructor(pop, screen=null, message=null) {
        this.pop = pop;
        this.screen = screen;
        this.message = message;
    }
};

/**
 * Basic screen class which does nothing and should be extended.
 */
fish.screen.Screen = class {
    /**
     * Creates the screen and gives it the context object that contains all the
     * subsystems and stuff.
     * @param {fish.screen~Context} ctx is stored by the base screen class so you
     *        always have access to it.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Called by the engine whenever the screen gets onto the top of the screen
     * stack.
     * @param {?Object} message something sent from the screen that allowed
     *        this screen to be revealed. Could be a return value from a screen
     *        this one pushed on top of itself or whatever you want.
     */
    refresh(message) {
        // by default does nothing.
    }

    /**
     * Updates the screen.
     * @param {number} delta is the amount of time passage to update for in
     *        seconds.
     * @return {?fish.screen.Transition} the update thing that tells the engine
     *         what to do next with regards to the screen stack. If null is
     *         returned then nothing is done.
     */
    update(delta) {
        // by default does nothing.
        return null;
    }

    /**
     * Renders the screen.
     * @param {boolean} front is whether this screen is the top one being
     *        rendered.
     */
    render(front) {
        // does nothing by default.
    }
};

fish.screen.SplashScreen = class extends fish.screen.Screen {
    constructor(ctx) {
        super(ctx);
        this.done = false;
        this.next = null;
        this.batch = null;
        this.font = null;
        this.sound = null;
        this.logo = new fish.util.Rect();
        this.spot = new fish.util.Vector();
        this.lines = [
            'fish-tank game engine version 645438567347',
            'created by Dany Burton 2021'
        ];
        this.gfxComp = ctx.gfx.getCompatability();
        this.sndComp = ctx.snd.getCompatability();
        this.inComp = ctx.in.getCompatability();
        this.timer = 0;
        this.sprite = new fish.util.Rect(0, 0, 0, 0);
        Promise.all([
            ctx.gfx.makeTexture(
                fish.constants.SPLASH,
                fish.constants.SPLASH_WIDTH,
                fish.constants.SPLASH_HEIGHT,
                ctx.gfx.gl.RGBA4
            ),
            ctx.snd.makeSample(fish.constants.JINGLE)
        ]).then(values => {
            this.ctx.snd.playSample(values[1]);
            this.font = new fish.graphics.BitmapFont(
                values[0].getRect()
            );
            this.logo.pos.set(
                this.font.getWidth('q') * 3,
                this.font.getLineHeight() * 11
            );
            this.logo.size.set(
                this.font.getWidth('c') * 4,
                this.font.getLineHeight() * 4
            );
            this.batch = new ctx.gfx.Batch(values[0], 512);
            (async function () {
                await fish.util.wait(1);
                this.lines.push(`graphics compatability ${this.gfxComp.level}: ${this.gfxComp.message}`);
                await fish.util.wait(1);
                this.lines.push(`sound compatability ${this.sndComp.level}: ${this.sndComp.message}`);
                await fish.util.wait(1);
                this.lines.push(`input compatability ${this.inComp.level}: ${this.inComp.message}`);
                await fish.util.wait(1);
                this.lines.push('the game is loading...');
                await fish.util.wait(1);
                this.done = true;
            }).call(this);
        });
        init.then((v) => {this.next = v;});
    }

    /** @inheritDoc */
    update(delta) {
        this.timer += delta;
        if (this.next && this.done) {
            return new fish.screen.Transition(true, this.next);
        }
        return null;
    }

    /** @inheritDoc */
    render(front) {
        if (!this.batch) return;
        this.batch.clear();
        let portion = 600 / (this.font.getLineHeight() * 12);
        let overhang = (this.timer * 32) % Math.abs(
            this.font.getLineHeight() * 12 - portion
        ) - this.font.getLineHeight() * 12;
        for (let i = 0; i < portion; i++) {
            this.batch.addComp(
                this.logo,
                0,
                i * this.font.getLineHeight() * 12 + overhang,
                this.logo.w * 3,
                (i + 1) * this.font.getLineHeight() * 12 + overhang
            );
        }
        this.spot.x = (this.font.getWidth('c') +
            this.font.getHorizontalPadding()) * 12;
        for (let i = 0; i < this.lines.length; i++) {
            this.spot.y = 600 - (this.font.getLineHeight() +
                this.font.getVerticalPadding()) * i;
            this.batch.addText(this.font, this.lines[i], this.spot);
        }
        this.batch.render();
    }
}
