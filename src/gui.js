var fish = fish || {};

/**
 * This file provides a kinda basic gui system for the user to interact with.
 * It only uses button input by default but it should be able to do menu type
 * stuff as well as game dialogue and basic hud if need be etc.
 * In the future I might add mouse support to the default input system in which
 * case I will also make the gui be able to use mouse at least if you want it
 * to.
 * Oh yeah, there is a field called default style. You need to set that field
 * to something before using the gui system, or you must call set style on all
 * gui nodes after or they will just crash.
 * @namespace
 */
fish.gui = {};

/**
 * Stores all the style information used to draw gui elements in one place.
 * It's just an object so that if I add more style stuff later it won't break
 * your code and you won't be using the new gui things that use the new stuff
 * anyway. Obviously you need to use the correct texture/batch for the drawing.
 * @typedef {Object} fish.gui~Style
 * @property {fish.graphics.BitmapFont} font font for writing text.
 * @property {fish.graphics.Patch} panel patch used for panel drawing.
 * @property {fish.graphics.Patch} button patch for normal button.
 * @property {fish.graphics.Patch} buttonSelected patch for selected button.
 * @property {fish.graphics.Patch} buttonDepressed patch for down button.
 * @property {fish.audio.Sample} tap sound for moving selection.
 * @property {fish.audio.Sample} click sound for clicking a button.
 */

/**
 * The style that knobs are given when they are created. You can change the
 * style afterwards. You can also change this value whenever you want, but if
 * you change it often just be cautious about what it is going to be next time.
 * @type fish.gui.Style
 */
fish.gui.defaultStyle = null;

/**
 * Base gui knob class. Yeah I call it knob instead of element or something
 * because element is long as hell and gay.
 */
fish.gui.Knob = class {
    constructor() {
        console.assert(fish.gui.defaultStyle);
        this.style = fish.gui.defaultStyle;
        this.fitted = false;
        this.bounds = null;
        this.usr = {};
    }

    /**
     * Tells you if this type of gui knob is selectable. If not then you cannot
     * interact with it.
     * @return {boolean} true iff you can interact.
     */
    selectable() {
        return false;
    }

    /**
     * Call a callback on this gui element and all of it's children.
     * @param {function} callback is the function to call on this.
     */
    propagate(callback) {
        callback(this);
    }

    /**
     * Sets the style of this knob and all it's children.
     * @param {fish.gui.Style} style is the style to set it to.
     */
    setStyle(style) {
        this.propagate(knob => {knob.style = style;});
    }
    
    /**
     * Fits the gui knob to the given area. Probably needs to be extended to be
     * useful a lot of the time.
     * @param {fish.util.Rect} bounds is the area to fit the element into.
     * @param {boolean} greedy whether to fill all available space even if not
     *        needed. This is what is wanted generally if user code calls fit,
     *        and sometimes it's needed for inner gui bits, but you obviously
     *        can't use it for every situation. Also, keep in mind it's more
     *        like a guideline than a rule, some things really can't be
     *        greedy, and some have no choice but to be greedy.
     */
    fit(bounds, greedy=true) {
        this.bounds = bounds;
        this.fitted = true;
    }

    /**
     * Updates the knob so that it can react to user input and potentially
     * return some stuff. Should recurse for nested elements.
     * @param {fish.input.UiInput} input is used to check if keys are pressed
     *        or whatever.
     * @param {fish.audio.SoundPlayer} audio is used to play sound effects 
     *        like buttons clicking and shit.
     * @param {boolean} selected is whether this thing is actually selected. It
     *        can still do stuff without being selected though don't worry.
     * @return {?Object} whatever you want to return, this is handled by user
     *         code. If you return from a nested gui element the outer ones
     *         should just return it recursively. If you return null that is
     *         considered to mean nothing happened.
     */
    update(input, audio, selected) {
        return null;
    }

    /**
     * Renders the gui element using the given patch renderer.
     * @abstract
     * @param {fish.graphics.Renderer.Batch} batch does the rendering.
     * @param {boolean} selected is whether the knob is currently selected.
     */
    render(batch, selected) {
        throw new Error('fish.gui.knob.render must be implemented');
    }
};

/**
 * Holds basic code for knobs that contain a bunch of other knobs so you don't
 * have to write a million variations of the same basic functionality.
 */
fish.gui.ContainerKnob = class extends fish.gui.Knob {
    /**
     * @param {Array.<fish.gui.Knob>} children is a list of children to add
     *        stright away.
     */
    constructor(children) {
        super();
        this.hasSelectable = false;
        this.selection = 0;
        this.children = [];
        for (let child of children) this.addChild(child);
    }

    /** @inheritDoc */
    selectable() {
        return this.hasSelectable;
    }

    /** @inheritDoc */
    propagate(callback) {
        super.propagate(callback);
        for (let child of this.children) child.propagate(callback);
    }

    /**
     * Increases or decreases the currently selected child.
     * @param {fish.audio.SoundPlayer} audio is to make a nice sound.
     * @param {number} direction is whether to go forward (> 0) or back (< 0).
     *        If you pass 0 nothing will happen.
     */
    incrementSelection(audio, direction) {
        if (direction == 0 || !this.hasSelectable) return;
        if (this.style.tap) audio.playSample(this.style.tap);
        let change = Math.sign(direction);
        for (let i = 0; i < this.children.length && change != 0; i++) {
            this.selection += change;
            if (this.selection < 0) this.selection = this.children.length - 1;
            if (this.selection >= this.children.length) this.selection = 0;
            if (this.children[this.selection].selectable()) change = 0;
        }
    }

    /**
     * Adds a child to the container.
     * @param {fish.gui.Knob} child is the thing to add.
     */
    addChild(child) {
        this.children.push(child);
        if (child.selectable() && !this.hasSelectable) {
            this.hasSelectable = true;
            this.selection = this.children.length - 1;
        }
    }
};

/**
 * Creates a panel that can stack contents vertically or horizontally in a nice
 * box.
 * @implements fish.gui.Knob
 */
fish.gui.PanelKnob = class extends fish.gui.ContainerKnob {
    /**
     * @param {boolean} [cancellable=false] is if pressing BUTTON.A
     *        will cause the panel to return null on the next update.
     * @param {Array.<fish.gui.Knob>} [children=[]] is a list of knobs to add as
     *        children to this panel.
     */
    constructor(cancellable=false, children=[]) {
        super(children);
        this.cancellable = cancellable;
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        let interior = bounds.copy();
        interior.shrink(
            this.style.panel.SIDE_BORDER,
            this.style.panel.TOP_BORDER
        );
        for (let i in this.children) {
            this.children[i].fit(
                interior.copy(),
                i == this.children.length - 1 && greedy
            );
            interior.size.y -= this.children[i].bounds.h;
        }
        if (greedy) {
            super.fit(bounds);
        } else {
            super.fit(new fish.util.Rect(
                bounds.x,
                bounds.y + interior.h,
                bounds.w,
                bounds.h - interior.h
            ));
        }
    }

    /** @inheritDoc */
    update(input, audio, selected) {
        if (selected && this.cancellable && input.down(fish.input.BUTTON.A)) {
            return null;
        }
        if (selected && this.children.length > 0) {
            if (input.justDown(fish.input.BUTTON.UP)) {
                this.incrementSelection(audio, -1);
            } else if (input.justDown(fish.input.BUTTON.DOWN)) {
                this.incrementSelection(audio, 1);
            }
        }
        for (let i in this.children) {
            let result = this.children[i].update(
                input,
                audio,
                i == this.selection && selected
            );
            if (result !== null) return result;
        }
        return null;
    }

    /** @inheritDoc */
    render(batch, selected) {
        batch.addPatch(this.style.panel, this.bounds);
        for (let i in this.children) {
            this.children[i].render(
                batch,
                selected && i == this.selection
            );
        }
    }

};

/**
 * Knob that just holds some text and does nothing.
 * @implements fish.gui.Knob
 */
fish.gui.TextKnob = class extends fish.gui.Knob {
    /**
     * @param {string} text the unwrapped text in which only multiple newlines
     *        are counted as newlines.
     */
    constructor(text) {
        super();
        this._text = text;
        this.fittedText = '';
        this.origin = new fish.util.Vector();
    }

    get content() {
        return this._text;
    }

    set content(value) {
        this._text = value;
        if (this.fitted) this.fit(this.bounds, false);
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        this.origin.x = bounds.x + 1;
        this.origin.y = bounds.t - 1;
        this.fittedText = fish.util.fitText(
            this._text,
            this.style.font,
            bounds.w - 2
        );
        let height = fish.util.textHeight(this.fittedText, this.style.font) + 2;
        bounds.pos.y += bounds.size.y - height;
        bounds.size.y = height;
        super.fit(bounds);
    }

    /** @inheritDoc */
    render(batch, selected) {
        batch.addText(
            this.style.font,
            this.fittedText,
            this.origin
        );
    }
};

/**
 * A button that you can have a nice click of.
 * @implements fish.gui.Knob
 */
fish.gui.ButtonKnob = class extends fish.gui.Knob {
    /**
     * @param {string|fish.gui.Knob} child is the child to put inside the
     *        button. If you passed text it is assumed you want it to be made
     *        into a text knob.
     * @param {?mixed} result is the thing to return from update if the button
     *        is pressed. Be warned, though, if this is a function it will be
     *        executed and then it's return value will be returned instead.
     */
    constructor(child, result=null) {
        super();
        this.down = false;
        this.result = result;
        if (typeof child == 'string') {
            this.child = new fish.gui.TextKnob(child);
        } else {
            this.child = child;
        }
    }

    /** @inheritDoc */
    selectable() {
        return true;
    }

    /** @inheritDoc */
    propagate(callback) {
        super.propagate(callback);
        if (this.child instanceof fish.gui.Knob) {
            this.child.propagate(callback);
        }
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        let interior = bounds.copy();
        interior.shrink(
            this.style.button.SIDE_BORDER,
            this.style.button.TOP_BORDER
        );
        this.child.fit(interior);
        if (!greedy) {
            bounds.size.y = this.child.bounds.size.y +
                this.style.button.TOP_BORDER * 2;
            bounds.pos.y = this.child.bounds.pos.y -
                this.style.button.TOP_BORDER;
        }
        super.fit(bounds);
    }

    /** @inheritDoc */
    update(input, audio, selected) {
        if (input.down(fish.input.BUTTON.B) && selected) {
            if (!this.down) {
                this.down = true;
                if (this.style.click) audio.playSample(this.style.click);
            }
        } else if (this.down) {
            this.down = false;
            if (selected) {
                if (typeof this.result == 'function') {
                    return this.result.call(this);
                }
                return this.result;
            }
        }
        return null;
    }

    /** @inheritDoc */
    render(batch, selected) {
        let patch = selected ?
            (this.down ? this.style.buttonDepressed : this.style.buttonSelected) :
            this.style.button;
        batch.addPatch(patch, this.bounds);
        this.child.render(batch, selected);
    }
};

/**
 * Displays a picture nestled within the gui system.
 */
fish.gui.PicKnob = class extends fish.gui.Knob {
    /**
     * @param {mixed} sprite the pic to draw.
     * @param {number} [scale=1] is the scale to draw it at. If the knob ends
     *        up being fitted greedily this will be ignored.
     * @param {boolean} [stretch=false] is whether the image should eschew it's
     *        aspect ratio to fill all the space it is given.
     */
    constructor(sprite, scale=1, stretch=false) {
        super();
        this.sprite = sprite;
        this.scale = scale;
        this.stretch = stretch;
    }
};

/**
 * Like a panel but it stores it's contents in equally sized areas separated
 * by vertical lines.
 */
fish.gui.HBoxKnob = class extends fish.gui.ContainerKnob {
    /**
     * @param {Array.<fish.gui.Knob>} [children=[]] is a list of children to
     *        add to the hbox right away.
     */
    constructor(children=[]) {
        super(children);
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        let interior = bounds.copy();
        let maxHeight = 0;
        interior.size.x /= this.children.length;
        for (let child of this.children) {
            child.fit(interior.copy(), greedy);
            interior.pos.x += interior.size.x;
            maxHeight = Math.max(maxHeight, child.bounds.size.y);
        }
        if (!greedy) bounds.size.y = maxHeight;
        super.fit(bounds, greedy);
    }

    /** @inheritDoc */
    update(input, audio, selected) {
        if (selected && this.children.length > 0) {
            if (input.justDown(fish.input.BUTTON.LEFT)) {
                this.incrementSelection(audio, -1);
            } else if (input.justDown(fish.input.BUTTON.RIGHT)) {
                this.incrementSelection(audio, 1);
            }
        }
        for (let i in this.children) {
            let result = this.children[i].update(
                input,
                audio,
                i == this.selection && selected
            );
            if (result) return result;
        }
    }

    /** @inheritDoc */
    render(batch, selected) {
        for (let i in this.children) {
            this.children[i].render(batch, selected && i == this.selection);
        }
    }
};

/**
 * A knob that shows an array of text characters that you can edit whenever.
 * @implements fish.gui.Knob
 */
fish.gui.TextArrayKnob = class extends fish.gui.Knob {
    constructor(width, height=1) {
        super();
        this.spareRect = new fish.util.Rect();
        this.width = width;
        this.height = height;
        this.scale = new fish.util.Vector(1, 1);
        this.array = [];
        for (let y = 0; y < height; y++) {
            let line = [];
            for (let x = 0; x < width; x++) {
                line.push(Math.floor(Math.random() * 200));
            }
            this.array.push(line);
        }
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        if (greedy) {
            super.fit(bounds, greedy);
            this.scale.x = bounds.size.x /
                (this.width * this.style.font.getWidth('n'));
            this.scale.y = bounds.size.y /
                (this.height * this.style.font.getLineHeight());
        } else {
            let newHeight = this.height * this.style.font.getLineHeight();
            bounds.pos.y += bounds.size.y - newHeight;
            bounds.size.y = newHeight;
            bounds.size.x = this.width * this.style.font.getWidth('n');
            super.fit(bounds, greedy);
        }
    }

    /** @inheritDoc */
    render(patchRenderer, selected) {
        let cWidth = this.style.font.getWidth('n') * this.scale.x;
        let cHeight = this.style.font.getLineHeight() * this.scale.y;
        this.spareRect.size.x = cWidth;
        this.spareRect.size.y = cHeight;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.spareRect.pos.x = this.bounds.x + x * cWidth;
                this.spareRect.pos.y = this.bounds.y + y * cHeight;
                patchRenderer.renderCharacter(
                    this.style.font,
                    this.array[y][x],
                    this.spareRect
                );
            }
        }
    }

    /**
     * Sets the point in the array given to the given character code.
     * @param {number} x is the column of the character to move.
     * @param {number} y is the row of the character to move.
     * @param {number} c is the character code to set it to.
     */
    setCharacter(x, y, c) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.array[y][x] = c;
    }
};

/**
 * Starting screen of the game that shows some crap and makes you click or
 * buttonise or whatever.
 */
fish.screen.SplashScreen = class extends fish.screen.Screen {
    constructor(ctx, init) {
        super(ctx);
        this.messaged = false;
        this.next = null;
        this.batch = null;
        this.font = null;
        this.sound = null;
        this.loaded = false;
        this.spot = new fish.util.Vector();
        this.timer = 90;
        this.sprite = new fish.util.Rect(0, 0, 0, 0);
        this.lines = [
            'fish-tank engine version 0.1.0',
            'Created by Dany Burton',
            'Game is loading...'
        ];
        this.roaches = [];
        for (let i = 0; i < 100; i++) {
            let size = i * 0.03;
            this.roaches.push({
                pos: new fish.util.Vector(
                    i % 30 * 50,
                    i / 30 * 100
                ),
                size: size,
                velocity: new fish.util.Vector(
                    (Math.random() - 0.5) * size * 24,
                    (Math.random() - 0.5) * size * 24
                )
            });
        }
        Promise.all([
            ctx.gfx.makeTexture(
                fish.constants.SPLASH,
                fish.constants.SPLASH_WIDTH,
                fish.constants.SPLASH_HEIGHT,
                ctx.gfx.gl.RGBA4
            ),
            ctx.snd.makeSample(fish.constants.JINGLE)
        ]).then(values => {
            this.font = new fish.graphics.BitmapFont(values[0].getRect());
            this.batch = new ctx.gfx.Batch(values[0], 512);
            this.logo = this.font.getRect(3, 11, 4, 4);
            this.logo.shrink(0.5);
            this.sound = values[1];
            this.loaded = true;
        });
        init.then((v) => {this.next = v;});
    }

    /** @inheritDoc */
    refresh(message) {
        if (this.sound) this.ctx.snd.playSong(this.sound);
    }

    /** @inheritDoc */
    update(delta) {
        for (let roach of this.roaches) {
            roach.pos.add(roach.velocity, delta);
            roach.pos.y += delta * 20;
            roach.pos.wrap(this.ctx.gfx.size);
        }
        if (this.loaded) {
            if (!this.messaged) {
                this.messaged = true;
                fish.gui.defaultStyle = {
                    font: this.font,
                    panel: this.font.getPatch(0, 11, 3, 3, 1),
                    button: this.font.getPatch(7, 11, 3, 3, 1),
                    buttonSelected: this.font.getPatch(10, 11, 3, 3, 1),
                    buttonDepressed: this.font.getPatch(13, 11, 3, 3, 1)
                };
                return new fish.screen.Transition(
                    false,
                    fish.gui.messageScreen(
                        this.ctx,
                        this.batch,
                        `Press ${this.ctx.in.nameCode(fish.input.BUTTON.B)} to start the game`,
                        '',
                        'OK'

                    )
                );
            }
            this.timer -= delta;
            if (this.timer < 0) {
                return new fish.screen.Transition(true, this.next);
            }
        }
        return null;
    }

    /** @inheritDoc */
    render(front) {
        if (!this.batch) return;
        this.ctx.gfx.clear(0, 0, 0, 1);
        this.batch.clear();
        for (let roach of this.roaches) {
            this.batch.add(this.logo, roach.pos, roach.size);
        }
        this.spot.x = 0;
        for (let i = 0; i < this.lines.length; i++) {
            this.spot.y = 600 - this.font.getLineHeight() * i;
            this.batch.addText(this.font, this.lines[i], this.spot);
        }
        this.batch.render();
    }
};

/**
 * Screen that hosts some gui stuff and returns when it finishes.
 * @extends {fish.screen.Screen}
 */
fish.gui.GuiScreen = class extends fish.screen.Screen {
    /**
     * @param {fish.Context} ctx usual screen context.
     * @param {fish.gui.Knob} knob gui stuff to display in this screen.
     */
    constructor(ctx, batch, knob) {
        super(ctx);
        this.knob = knob;
        this.batch = batch;
    }

    /** @inheritDoc */
    update(delta) {
        let result = this.knob.update(this.ctx.in, this.ctx.snd, true);
        if (result !== null) {
            return new fish.screen.Transition(true, null, result);
        }
        return null;
    }

    /** @inheritDoc */
    render(front) {
        this.batch.clear();
        this.knob.render(this.batch, true);
        this.batch.render();
    }
};

/**
 * Creates a screen which shows a message and one or more confirmation buttons.
 * @param {fish.Context} ctx is the context which the screen needs.
 * @param {fish.graphics.Renderer.Batch} batch does rendering.
 * @param {string} heading is the heading of the message box.
 * @param {...string} choices is all the choices you can choose, when the
 *        screen pops off the screen stack the screen beneath will receive the
 *        number of the choice chosen. If you provide no choices then it will
 *        just add a generic one.
 */
fish.gui.messageScreen = (ctx, batch, heading, message, ...choices) => {
    if (choices.length == 0) choices[0] = '...';
    let panel = new fish.gui.PanelKnob(false, [
        new fish.gui.PanelKnob(false, [new fish.gui.TextKnob(heading)]),
        new fish.gui.TextKnob(message)
    ]);
    for (let i = 0; i < choices.length; i++) {
        panel.addChild(new fish.gui.ButtonKnob(choices[i], i));
    }
    let widthBit = ctx.gfx.size.x / 4;
    let heightBit = ctx.gfx.size.y / 4;
    panel.fit(
        new fish.util.Rect(widthBit, heightBit, widthBit * 2, heightBit * 2),
        true
    );
    return new fish.gui.GuiScreen(ctx, batch, panel);
};
