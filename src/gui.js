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
 * Stores all the style information used to draw gui elements in one place.
 * It's just an object so that if I add more style stuff later it won't break
 * your code and you won't be using the new gui things that use the new stuff
 * anyway.
 * @interface fish.gui.Style
 */

/**
 * The font for writing text in the gui.
 * @member fish.gui.Style#font
 * @type fish.util.Rect
 */

/**
 * The patch to draw panels with.
 * @member fish.gui.Style#panel
 * @type fish.graphics.Patch
 */

/**
 * The patch to draw buttons with.
 * @member fish.gui.Style#button
 * @type fish.graphics.Patch
 */

/**
 * The patch to draw depressed buttons with.
 * @member fish.gui.Style#buttonDown
 * @type fish.graphics.Patch
 */

/**
 * The patch to draw over stuff that is selected.
 * @member fish.gui.Style#select
 * @type fish.graphics.Patch
 */

/**
 * Base gui knob class. Yeah I call it knob instead of element or something
 * because element is long as hell and gay.
 */
fish.gui.Knob = class {
    /**
     * @param {fish.gui.Style} style is used to style it.
     */
    constructor(style) {
        this.fitted = false;
        this.bounds = null;
        this.style = style;
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
     * @param {fish.audio.SamplePlayer} audio is used to play sound effects 
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
     * @param {fish.graphics.PatchRenderer} patchRenderer does the rendering.
     * @param {boolean} selected is whether the knob is currently selected.
     */
    render(patchRenderer, selected) {
        throw new Error('fish.gui.knob.render must be implemented');
    }
};

/**
 * Holds basic code for knobs that contain a bunch of other knobs so you don't
 * have to write a million variations of the same basic functionality.
 */
fish.gui.ContainerKnob = class extends fish.gui.Knob {
    /**
     * @param {fish.gui.Style} styles the container.
     * @param {Array.<fish.gui.Knob>} children is a list of children to add
     *        stright away.
     */
    constructor(style, children) {
        super(style);
        this.hasSelectable = false;
        this.selection = 0;
        this.children = [];
        for (let child of children) this.addChild(child);
    }

    /** @inheritDoc */
    selectable() {
        return this.hasSelectable;
    }

    /**
     * Increases or decreases the currently selected child.
     * @param {fish.audio.SamplePlayer} audio is to make a nice sound.
     * @param {number} direction is whether to go forward (> 0) or back (< 0).
     *        If you pass 0 nothing will happen.
     */
    incrementSelection(audio, direction) {
        if (direction == 0 || !this.hasSelectable) return;
        audio.playSample(this.style.tap);
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
     * @param {fish.gui.Style} style used to style it.
     * @param {boolean} [cancellable=false] is if pressing UI_BUTTON.CANCEL
     *        will cause the panel to return null on the next update.
     * @param {Array.<fish.gui.Knob>} [children=[]] is a list of knobs to add as
     *        children to this panel.
     */
    constructor(style, cancellable=false, children=[]) {
        super(style, children);
        this.cancellable = cancellable;
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        let interior = bounds.copy();
        interior.shrink(this.style.panel.BORDER);
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
        if (selected && this.cancellable && input.uiDown(fish.input.UI_BUTTON.CANCEL)) {
            return null;
        }
        if (selected && this.children.length > 0) {
            if (input.uiJustDown(fish.input.UI_BUTTON.UP)) {
                this.incrementSelection(audio, -1);
            } else if (input.uiJustDown(fish.input.UI_BUTTON.DOWN)) {
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
    render(patchRenderer, selected) {
        patchRenderer.renderPatch(this.style.panel, this.bounds);
        for (let i in this.children) {
            this.children[i].render(
                patchRenderer,
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
     * @param {fish.gui.Style} style the style used by the knob.
     * @param {string} text the unwrapped text in which only multiple newlines
     *        are counted as newlines.
     */
    constructor(style, text) {
        super(style);
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
    render(patchRenderer, selected) {
        patchRenderer.renderText(
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
     * @param {fish.gui.Style} style is the style to draw it with.
     * @param {string|fish.gui.Knob} child is the child to put inside the
     *        button. If you passed text it is assumed you want it to be made
     *        into a text knob.
     * @param {?mixed} result is the thing to return from update if the button
     *        is pressed. Be warned, though, if this is a function it will be
     *        executed and then it's return value will be returned instead.
     */
    constructor(style, child, result=null) {
        super(style);
        this.down = false;
        this.result = result;
        if (typeof child == 'string') {
            this.child = new fish.gui.TextKnob(style, child);
        } else {
            this.child = child;
        }
    }

    /** @inheritDoc */
    selectable() {
        return true;
    }

    /** @inheritDoc */
    fit(bounds, greedy=true) {
        let interior = bounds.copy();
        interior.shrink(this.style.button.BORDER);
        this.child.fit(interior);
        if (!greedy) {
            bounds.size.y = this.child.bounds.size.y +
                this.style.button.BORDER * 2;
            bounds.pos.y = this.child.bounds.pos.y - this.style.button.BORDER;
        }
        super.fit(bounds);
    }

    /** @inheritDoc */
    update(input, audio, selected) {
        if (input.uiDown(fish.input.UI_BUTTON.ACCEPT) && selected) {
            if (!this.down) {
                this.down = true;
                audio.playSample(this.style.click);
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
    render(patchRenderer, selected) {
        let patch = selected ?
            (this.down ? this.style.buttonDepressed : this.style.buttonSelected) :
            this.style.button;
        patchRenderer.renderPatch(patch, this.bounds);
        this.child.render(patchRenderer, selected);
    }
};

/**
 * Displays a picture nestled within the gui system.
 */
fish.gui.PicKnob = class extends fish.gui.Knob {
    /**
     * @param {fish.gui.Style} style the style.
     * @param {mixed} sprite the pic to draw.
     * @param {number} [scale=1] is the scale to draw it at. If the knob ends
     *        up being fitted greedily this will be ignored.
     * @param {boolean} [stretch=false] is whether the image should eschew it's
     *        aspect ratio to fill all the space it is given.
     */
    constructor(style, sprite, scale=1, stretch=false) {
        super(style);
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
     * @param {fish.gui.Style} style decides how stuff is displayed.
     * @param {Array.<fish.gui.Knob>} [children=[]] is a list of children to
     *        add to the hbox right away.
     */
    constructor(style, children=[]) {
        super(style, children);
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
            if (input.uiJustDown(fish.input.UI_BUTTON.LEFT)) {
                this.incrementSelection(audio, -1);
            } else if (input.uiJustDown(fish.input.UI_BUTTON.RIGHT)) {
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
    render(patchRenderer, selected) {
        for (let i in this.children) {
            this.children[i].render(
                patchRenderer,
                selected && i == this.selection
            );
        }
    }
};

/**
 * A knob that shows an array of text characters that you can edit whenever.
 * @implements fish.gui.Knob
 */
fish.gui.TextArrayKnob = class extends fish.gui.Knob {
    constructor(style, width, height=1) {
        super(style);
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
