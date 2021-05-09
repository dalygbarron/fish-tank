var fish = fish || {};

/**
 * This file provides a kinda basic gui system for the user to interact with.
 * It only uses button input by default but it should be able to do menu type
 * stuff as well as game dialogue and basic hud if need be etc.
 * In the future I might add mouse support to the default input system in which
 * case I will also make the gui be able to use mouse at least if you want it
 * to.
 * @namespace
 */
fish.gui = {};

/**
 * Stores all the style info that is used to draw gui elements.
 */
fish.gui.Style = class {

};

/**
 * Base gui knob class. Yeah I call it knob instead of element or something
 * because element is long as hell and gay.
 */
fish.gui.Knob = class {
    /**
     * Creates the knob.
     * @param {fish.gui.Style} style is used to style it.
     */
    constructor(style) {
        this.fitted = false;
        this.bounds = null;
        this.style = style;
    }
    
    /**
     * Fits the gui knob to the given area. Probably needs to be extended to be
     * useful a lot of the time.
     * @param {fish.util.Rect} bounds is the area to fit the element into.
     */
    fit(bounds) {
        this.bounds = bounds;
        this.fitted = true;
    }

    /**
     * Updates the knob so that it can react to user input and potentially
     * return some stuff. Should recurse for nested elements.
     * @return {?Object} whatever you want to return, this is handled by user
     * code. If you return from a nested gui element the outer ones should just
     * return it recursively. If you return null that is considered to mean
     * nothing happened.
     */
    update(input) {
        return null;
    }

    /**
     * Renders the gui element using the given patch renderer.
     * @abstract
     * @param {fish.graphics.PatchRenderer} patchRenderer does the rendering.
     */
    render(patchRenderer) {
        throw new Error('fish.gui.knob.render must be implemented');
    }
};

/**
 * Creates a panel that can stack contents vertically or horizontally in a nice
 * box.
 */
fish.gui.PanelKnob = class extends fish.gui.Knob {
    /**
     * Creates a panel and says whether it is vertical or horizontal.
     * @param {fish.gui.Style} style is used to style it.
     * @param {boolean} vertical is whether it is vertical. If not it is
     * horizontal.
     */
    constructor(style, vertical=true) {
        super.constructor(style);
        this.children = [];
        this.vertical = vertical;
    }

    /**
     * Adds a child to the panel.
     * @param {fish.gui.Knob} child is the thing to add.
     */
    addChild(child) {
        this.children.push(child);
    }

    /**
     * @inheritDoc
     */
    fit(bounds) {
        super.fit(bounds);
        // TODO: iterate over the contents, take into account the padding of
        // the patch thingy, and fit them into some spaces, also need to figure
        // out how much space is left after.
    }
};

fish.gui.ButtonKnob = class extends fish.gui.Knob {
    /**
     * Creates the button.
     * @param {fish.gui.Style} style is the style to draw it with.
     * @param {fish.gui.Knob} child is the child to put inside the button.
     */
    constructor(style, child) {
        super.constructor(style);
        this.child = child;
    }

    /**
     * @inheritDoc
     */
    fit(bounds) {
        super.fit(bounds);
    }
};

/*
 * Ok so how the hell am I gonna do this? The gui system needs to be set up so
 * that it can work with any renderer. Well, actually so it doesn't need to
 * work with the overall renderer in the case of the sprite renderer, it needs
 * to work with the sprite batch, and it also needs to know which sprites are
 * used for what parts of itself.
 * For sound it just needs to have a sound and be able to play it on the sound
 * player.
 * For input it needs to query a couple of things which I have already set up.
 * So yeah, main thing is graphics. Basically, I think I should make it that
 * you can only have one sprite atlas per sprite renderer because it's gonna be
 * a massive pain otherwise. eh but you need the renderer object to load
 * textures rn so that would suck.
 * So no, you can have as many as you want, but when you create guis you need
 * to pass them some kind of theme object which defines the sounds to play and
 * the sprites to draw with etc, and these sprites are obviously going to
 * presume that you are using some certain texture so if you ain't it's gonna
 * look pretty fucked up.
 * Yeah so then each frame you have to call update on your gui like you
 * generally would and in the render function you will call render on it while
 * passing it the batch that it will draw with.
 *
 * There are some other questions like what widgets there will be and how it
 * will be arranged etc etc but that is for antoher time.
 *
 *
 * Ok so how are we going to do the other part? First lets think about what the
 * use cases are so we can think of an idea that fits all of them.
 *
 * We need to be able to make passive windows that show the value of some
 * variable in like a bar graph or a number or something.
 * We need to be able to make text boxes and dialogs in games.
 * We need to be able to create menus where the user can change settings and
 * whatever the fuck else.
 * We need to be able to create level editors and tools like that.
 *
 * Uhhhhh yeah basically I think the usual shit will be fine. We need to make
 * it that there are buttons that can actually end the gui thing and evaluate
 * to something and there are some that just modify some variable without
 * changing anything. We also need some ones that can do some arbitrary shit or
 * render some arbitrary shit.
 */
