var fish = fish || {};

/**
 * Provides some basic utility stuff. Maths classes and whatever the hell ya
 * know.
 * @namespace
 */
fish.util = {};

/**
 * Represents a two dimensional point / direction via cartesian coordinates.
 * @constructor
 * @param {number} x is the horizontal part.
 * @param {number} y is the vector part.
 */
fish.util.Vector = function (x, y) {
    this.x = x;
    this.y = y;

    /**
     * Adds another vector or value to this vector and returns the result
     * without changing this object.
     * @param {fish.util.Vector|number} other is the one to add.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.plus = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x + other.x, this.y + other.y) :
            new fish.util.Vector(this.x + other, this.y + other);
    };

    /**
     * Subtracts another vector or value from this vector and returns the
     * result without changing this object.
     * @param {fish.util.Vector|number} other is the one to subtract.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.minus = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x - other.x, this.y - other.y) :
            new fish.util.Vector(this.x - other, this.y - other);
    };

    /**
     * Multiplies another vector or value with this vector and returns the
     * result without changing this object.
     * @param {fish.util.Vector|number} other is the one to multiply.
     * @return {fish.util.Vector} a new vector that is the result.
     */
    this.times = other => {
        return (other instanceof fish.util.Vector) ?
            new fish.util.Vector(this.x - other.x, this.y - other.y) :
            new fish.util.Vector(this.x - other, this.y - other);
    };

    /**
     * Adds another vector to this vector, modifying this one.
     * @param {fish.util.Vector|number} other is the other value or vector.
     */
    this.add = other => {
        let thingy = this.plus(other);
        this.x = thingy.x;
        this.y = thingy.y;
    };

    /**
     * Wraps this vector in a rectangle that starts at (0, 0) then goes to
     * bounds.
     * @param {fish.util.Vector} bounds is a vector representing the far
     *                           corner.
     */
    this.wrap = (bounds) => {
        this.x = (this.x < 0) ? (bounds.x - Math.abs(this.x % bounds.x)) :
            (this.x % bounds.x);
        this.y = (this.y < 0) ? (bounds.y - Math.abs(this.y % bounds.y)) :
            (this.y % bounds.y);
    };
};

// TODO: might be useful to have an immutable vector class that wraps around an
// existing vector but only gives you an immutable view of it. hmmm or it would
// be a big wank for no reason.

/**
 * Represents an axis aligned rectangle and it should be immutable I think.
 * wait no. But I should make it immutable maybe.
 */
fish.util.Rect = class {
    /**
     * Creates the rectangle.
     * @param x is the horizontal position of the rectangle.
     * @param y is the vertical position of the rectangle.
     * @param w is the width of the rectangle.
     * @param h is the height of the rectangle.
     */
    constructor(x, y, w, h) {
        this.pos = new fish.util.Vector(x, y);
        this.size = new fish.util.Vector(w, h);
    }

    /**
     * Gets the horizontal position of the rectangle.
     * @return x
     */
    get x() {
        return this.pos.x;
    }

    /**
     * Gets the vertical position of the rectangle.
     * @return y.
     */
    get y() {
        return this.pos.y;
    }

    /**
     * Gets the width of the rectangle.
     * @return w.
     */
    get w() {
        return this.size.x;
    }

    /**
     * Gets the height of the rectangle.
     * @return h.
     */
    get h() {
        return this.size.y;
    }

    /**
     * Gets the position of the right hand side of the rectangle.
     * @return x + w
     */
    get r() {
        return this.pos.x + this.size.x;
    }

    /**
     * Gets the position of the bottom of the rectangle.
     * @return y + h
     */
    get b() {
        return this.pos.y + this.size.y;
    }
};

/**
 * Asynchronously loads a text file in.
 * @param {string} url is the url to load the file from.
 * @return {Promise<string>} that resolves to the loaded file content.
 */
fish.util.loadText = async function (url) {
    return await new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) resolve(this.responseText);
                else reject(
                    `couldn't get file '${url}', response code ${this.status}`
                );
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    });
};

var fish = fish || {};

/**
 * This file provides functionality for doing graphics stuff. A lot of it is
 * made publically accessible so that if you don't like the SpriteRenderer
 * class for rendering, you can create your own class and use as much existing
 * functionality as possible to save you some time and potentially make
 * different rendering classes as interoperable as practical.
 * So, unless you want to make your own rendering class, probably the only
 * thing you are going to use from this file is SpriteRenderer.
 * @namespace
 */
fish.graphics = {};

/**
 * Creates a texture object out of a gl texture. You probably don't want to
 * instantiate one of these directly unless you are creating your own graphics
 * system.
 * @constructor
 * @param {number} glTexture is the open gl reference to the texture.
 * @param {number} width     is the width of the texture.
 * @param {number} height    is the height of the texture.
 */
fish.graphics.Texture = function (glTexture, width, height) {
    /**
     * Gives you the opengl texture.
     * @return {number} the opengl reference to the texture.
     */
    this.getGlTexture = () => {
        return glTexture;
    };

    /**
     * Gives you the width of the texture.
     * @return {number} the width.
     */
    this.getWidth = () => {
        return width;
    };

    /**
     * Gives you the height of the texture.
     * @return {number} the height.
     */
    this.getHeight = () => {
        return height;
    };
};

/**
 * Stores sprites. You probably don't want to instantiate one of these directly
 * unless you are creating your own graphics system.
 * @constructor
 */
fish.graphics.Atlas = function () {
    let sprites = {};

    /**
     * Adds a sprite into the atlas.
     * @param {string}         name   is the name of the atlas.
     * @param {fish.util.Rect} sprite is the sprite to add.
     */
    this.add = (name, sprite) => {
        sprites[name] = sprite;
    };

    /**
     * Gets a sprite out of the atlas.
     * @param {string} name is the name of the sprite to get.
     * @return {fish.util.Rect} the sprite found or an empty one if it lacks it.
     */
    this.get = (name) => {
        if (name in this.sprites) return this.sprites[name];
        console.error(`unknown sprite name ${name}`);
        return new fish.util.Rect(0, 0, 0, 0);
    };

    /**
     * Tells you the number of sprites.
     * @return {number} the number of sprites.
     */
    this.n = () => {
        return Object.keys(sprites).length;
    };

    /**
     * The atlas foreach callback structure which gets called on each sprite in
     * the atlas.
     * @callback fish.graphics.Atlas~callback
     * @param {string}         name   is the name of the sprite.
     * @param {fish.util.Rect} sprite is the sprite.
     */

    /**
     * Iterates over all sprites in the atlas.
     * @param {fish.graphics.Atlas~callback} callback is a callback to run for each one.
     */
    this.forEach = callback => {
        for (let sprite in sprites) callback(sprite, sprites[sprite]);
    };
};

/**
 * Represents a colour with parts from 0 to 1.
 * @constructor
 * @param {number} r is the red part.
 * @param {number} g is the green part.
 * @param {number} b is the blue part.
 * @param {number} a is the transparancy part.
 */
fish.graphics.Colour = function (r=1, g=1, b=1, a=1) {
    /** 
     * Red component of the colour from 0 to 1.
     * @member {number}
     */
    this.r = r;

    /**
     * Green component of the colour from 0 to 1.
     * @member {number}
     */
    this.g = g;

    /**
     * Blue component of the colour from 0 to 1.
     * @member {number}
     */
    this.b = b;

    /**
     * The transparancy part of the colour from 0 to 1.
     * @member {number}
     */
    this.a = a;
};

/**
 * Asynchronously loads a texture out of a url. This function requires you to
 * pass a gl context so you probably want to use the version built into the
 * renderer unless you are making your own graphics system.
 * @async
 * @param {string} url is the url to load the texture from.
 * @return {Promise<fish.graphics.Texture>} the loaded texture.
 */
fish.graphics.loadTexture = async function (gl, url) {
    return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );
            resolve(new fish.graphics.Texture(
                texture,
                image.width,
                image.height
            ));
        };
        image.onerror = () => {
            reject(`failed loading image ${url}`);
        };
        image.src = url;
    });
};



/**
 * Loads in the data part of a texture atlas.
 * @async
 * @param {string} url is the url to load it from.
 * @return {Promise<fish.graphics.Atlas>} the created atlas.
 */
fish.graphics.loadAtlas = async function (url) {
    let text = await fish.util.loadText(url);
    if (text == null) return null;
    let data = JSON.parse(text);
    let atlas = new fish.graphics.Atlas();
    for (let frame in data) {
        let rect = data[frame];
        atlas.add(
            frame,
            new fish.util.Rect(rect.x, rect.y, rect.w, rect.h)
        );
    }
    return atlas;
};

/**
 * 9 patch implementation that uses a sprite rectangle for each part of the
 * patch. This is just the object that holds the data for the 9 patch.
 */
fish.graphics.Patch = class {
    /**
     * Creates it by giving a sprite and a border around the outside which
     * becomes the non middle parts.
     * @param rect is the overall sprite to make the patch from.
     * @param born is the width of the border of the patch.
     */
    constructor(rect, bord) {
        let hMid = rect.w - bord * 2;
        let vMid = rect.h - bord * 2;
        if (hMid < 1 || vMid < 1) {
            throw `${bord} is too wide a border for ${rect.w},${rect.h}`;
        }
        let tl = fish.util.Rect(rect.x, rect.y, bord, bord);
        let t = fish.util.Rect(rect.x + bord, rect.y, hMid, bord);
        let tr = fish.util.Rect(rect.x + bord + hMid, rect.y, bord, bord);
        let ml = fish.util.Rect(rect.x, rect.y + bord, bord, vMid);
        let m = fish.util.Rect(rect.x + bord, rect.y + bord, hMid, vMid);
        let mr = fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord,
            bord,
            vMid
        );
        let bl = fish.util.Rect(rect.x, rect.y + bord + vMid, bord, bord);
        let b = fish.util.Rect(
            rect.x + bord,
            rect.y + bord + vMid,
            hMid,
            bord
        );
        let br = fish.util.Rect(
            rect.x + bord + hMid,
            rect.y + bord + vMid,
            bord,
            bord
        );
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get tl() {
        return tl;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get t() {
        return t;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get tr() {
        return tr;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get ml() {
        return ml;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get m() {
        return m;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get mr() {
        return mr;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get bl() {
        return bl;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get b() {
        return b;
    }

    /**
     * Gets the rect for there.
     * @return the rect.
     */
    get br() {
        return br;
    }

    /**
     * Gives you the rect's border size.
     * @return the border size as in perpendicular distance from the outside.
     */
    get border() {
        return border;
    }
};

/**
 * The default graphics handler which uses a sprite batch to draw nice
 * pictures.
 * @constructor
 * @param gl is the opengl context.
 */
fish.graphics.SpriteRenderer = function (gl) {
    let usedTextures = [];
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.width = gl.canvas.clientWidth;
    this.height = gl.canvas.clientHeight;


    /**
     * A thing that batches draw calls.
     * @constructor
     * @param {fish.graphics.Texture} texture is the texture all the draws must
     *                                        be from.
     * @param {number}                max     is the max things to draw.
     */
    this.Batch = function (texture, max) {
        let items = new Float32Array(max * 12);
        let textureItems = new Float32Array(max * 12);
        let n = 0;
        let rendered = false;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, items, gl.DYNAMIC_DRAW);
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textureItems, gl.DYNAMIC_DRAW);

        /**
         * Adds a sprite to the list of those to draw.
         * @param {fish.util.Rect} src is the src rectangle from the texture.
         * @param {fish.util.Rect|fish.util.Vector} dst is where to draw it on
         * the screen. If it's a vector then that is the centre.
         * @param {number} scale is used to scale the sprite if you used
         * a vector. If you used a rect it does nothing.
         */
        this.add = (src, dst, scale=1) => {
            if (n >= max) return;
            const offset = n * 12;
            items[offset] = dst.x;
            items[offset + 1] = dst.y;
            items[offset + 2] = dst.r;
            items[offset + 3] = dst.y;
            items[offset + 4] = dst.x;
            items[offset + 5] = dst.b;
            items[offset + 6] = dst.r;
            items[offset + 7] = dst.y;
            items[offset + 8] = dst.r;
            items[offset + 9] = dst.b;
            items[offset + 10] = dst.x;
            items[offset + 11] = dst.b;
            textureItems[offset] = src.x;
            textureItems[offset + 1] = src.b;
            textureItems[offset + 2] = src.r;
            textureItems[offset + 3] = src.b;
            textureItems[offset + 4] = src.x;
            textureItems[offset + 5] = src.y;
            textureItems[offset + 6] = src.r;
            textureItems[offset + 7] = src.b;
            textureItems[offset + 8] = src.r;
            textureItems[offset + 9] = src.y;
            textureItems[offset + 10] = src.x;
            textureItems[offset + 11] = src.y;
            n++;
        };

        /**
         * Draws a 9 patch at the given place. If you give an area that is too
         * small it will look munted beware.
         * @param patch is the 9patch to draw.
         * @param dst   is the place to draw it.
         */
        this.addPatch = (patch, dst) => {
            let rect = new fish.util.Rect(0, 0, 0, 0);
            this.add(patch.tl, new fish.util.Rect(
                dst.x,
                dst.y,
                patch.border,
                patch.border
            ));
            this.add(patch.t, new fish.util.Rect(
                dst.x + patch.border,
                dst.y,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.tr, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y,
                patch.border,
                patch.border
            ));
            this.add(patch.ml, new fish.util.Rect(
                dst.x,
                dst.y + patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.m, new fish.util.Rect(
                dst.x + patch.border,
                dst.y + patch.border,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.mr, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y + patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.bl, new fish.util.Rect(
                dst.x,
                dst.y + dst.h - patch.border,
                patch.border,
                patch.border
            ));
            this.add(patch.b, new fish.util.Rect(
                dst.x + patch.border,
                dst.y + dst.h - patch.border,
                dst.w - patch.border * 2,
                patch.border
            ));
            this.add(patch.br, new fish.util.Rect(
                dst.x + dst.w - patch.border,
                dst.y + dst.h - patch.border,
                patch.border,
                patch.border
            ));
        };

        /**
         * Blanks the contents of the batch to go again.
         */
        this.clear = () => {
            rendered = false;
            n = 0;
        };

        /**
         * Renders what the batch currently has to the screen.
         */
        this.render = () => {
            if (rendered) {
                console.error('repeat batch rendering without clear');
                return;
            }
            rendered = true;
            let shader = fish.shader.bindDefaultShader(gl);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, items);
            gl.vertexAttribPointer(shader.position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, textureItems);
            gl.vertexAttribPointer(
                shader.textureCoord,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );
            gl.enableVertexAttribArray(shader.textureCoord);
            // TODO: decide active texture better.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture.getGlTexture());
            gl.uniform1i(shader.sampler, 0);
            gl.uniform2f(
                shader.invTextureSize,
                1 / texture.getWidth(),
                1 / texture.getHeight()
            );
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
        };
    };

    /**
     * Loads a texture using this graphics thing's gl context.
     * @param {string} url is the url of the texture to load.
     * @return {Promise<fish.graphics.Texture>} the texture if it worked.
     */
    this.loadTexture = async function (url) {
        return await fish.graphics.loadTexture(gl, url);
    };

    /**
     * Same as clear but uses components of the colour instead of an object.
     * @param {number} r is the red part.
     * @param {number} g is the green part.
     * @param {number} b is the blue part.
     * @param {number} a is the transparancy part.
     */
    this.clear = (r=1, g=1, b=1, a=1) => {
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    /**
     * Clears the screen with a colour object.
     * @param {fish.graphics.Colour} colour is the colour to clear with.
     */
    this.clearColour = colour => {
        this.clear(colour.r, colour.g, colour.b, colour.a);
    };
};

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.BLACK = new fish.graphics.Colour(0, 0, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.WHITE = new fish.graphics.Colour(1, 1, 1, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.RED = new fish.graphics.Colour(1, 0, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.GREEN = new fish.graphics.Colour(0, 1, 0, 1);

/**
 * @constant
 * @type fish.graphics.Colour
 */
fish.graphics.BLUE = new fish.graphics.Colour(0, 0, 1, 1);

var fish = fish || {};

/**
 * This file provides audio playing and loading functionality and a basic sound
 * player class. This player only supports playing audio files that are fully
 * loaded into memory, there is no audio streaming because it would lag and
 * suck.
 * If you need more flexible audio playing then feel free to create your own
 * class that does what you need.
 * @namespace
 */
fish.audio = {};

/**
 * Nice little sample object that stores it's name so we can use that for
 * stuff. You probably don't want to create one of these directly unless you
 * are creating your own audio system.
 * @constructor
 * @param name   is the name / url of the samepl.
 * @param buffer is the actual audio data.
 */
fish.audio.Sample = function (name, buffer) {
    this.name = name;
    this.buffer = buffer;
};

/**
 * A basic audio handler that has a music channel, a looping background sound
 * channel, and a couple of channels for playing sound effects.
 * @constructor
 * @param {AudioContext} context is the audio context.
 * @param {number} players is the number of samples that can play at once.
 */
fish.audio.BasicAudio = function (context, players=3) {
    let songPlayer = context.createBufferSource();
    let noisePlayer = context.createBufferSource();
    songPlayer.connect(context.destination);
    noisePlayer.connect(context.destination);
    let playingSong = '';
    let playingNoise = '';
    let soundPlayers = [];
    let frame = 0;

    /**
     * Little thing that holds an audio buffer source and keeps track of what
     * it is being used for.
     * @private
     * @constructor
     */
    let SamplePlayer = function () {
        let source = context.createBufferSource();
        source.connect(context.destination);
        let playing = false;
        let start = 0;
        let sample = null;
        let priority = 0;

        /**
         * Tells you if this sample player is currently playing.
         * @return true if it is playing.
         */
        this.isPlaying = () => {
            return playing;
        };

        /**
         * Tells you the tick that the current sample started on.
         * @return the tick as a number.
         */
        this.getStart = () => {
            return start;
        };

        /**
         * Tells you the priority of the currently playing sample on this
         * thing. Keep in mind if it's not actually playing it's really not
         * that high priority.
         * @return the priority of the last played sample.
         */
        this.getPriority = () => {
            return priority;
        };

        /**
         * Play a given sample.
         * @param sample   is the sample to play.
         * @param priority is the priority to say this had.
         */
        this.play = (sample, priority) => {
            playing = true;
            start = frame;
            sample = sample;
            priority = priority;
            source.buffer = sample.buffer;
            source.start(0);
            source.onended = () => {playing = false;};
        };

        /**
         * Tells you if a given sample is the same as the one this one is
         * playing.
         * @param sample is the sample to check.
         * @return true if they are the same and this sample player is still
         *              playing.
         */
        this.same = sample => {
            return playing && sample && sample.name == this.sample.name;
        };

        /**
         * Tells you if this sample player is less important than another
         * hypothetical sample player playing with the given properties.
         * @param otherPriority is the priority of the other sample player.
         * @param otherStart    is the start of the other sample player.
         * @return true if this one is less important.
         */
        this.lesser = (otherPriority, otherStart) => {
            return !playing || priority < otherPriority ||
                (priority == otherPriority && start < otherStart);
        };
    };

    for (let i = 0; i < players; i++) soundPlayers.push(new SamplePlayer());

    /**
     * Updates the audio player. Needs to be done once per frame.
     */
    this.update = () => {
        frame++;
    };

    /**
     * Plays a sample as long as it has not played since the last refresh.
     * @param {fish.audio.Sample} sample   is the sample to play.
     * @param {number}            priority is it's priority so it can play
     *                            over things of lesser importance.
     */
    this.playSample = (sample, priority=0) => {
        let chosen = -1;
        let chosenPriority = -99999;
        let chosenStart = 0;
        for (let i = 0; i < soundPlayers.length; i++) {
            if (soundPlayers[i].same(sample) &&
                soundPlayers[i].getStart() == frame) {
                return;
            }
            if (soundPlayers[i].lesser(chosenPriority, chosenStart)) {
                chosen = i;
                chosenPriority = soundPlayers[i].getPriority();
                chosenStart = soundPlayers[i].getStart();
            }
        }
        if (chosen >= 0) {
            soundPlayers[chosen].play(sample, priority);
        }
    };

    /**
     * Play the given song and if it is already playing then do nothing.
     * @param {fish.audio.Sample} sample is the audio to play.
     */
    this.playSong = sample => {
        if (playingSong == sample.name) {
            return;
        }
        playingSong = sample.name;
        songPlayer.buffer = sample.buffer;
        songPlayer.start(0);
    };

    /**
     * Load a song from the store and then play it right away.
     * @param {fish.Store} store is the store to load from.
     * @param {string}     name  is the key to the song as you would normally
     *                           use to load it from the store.
     */
    this.loadSong = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Play the given noise and if it is already playing then do nothing.
     * @param {fish.audio.Sample} sample is the audio to play.
     */
    this.playNoise = sample => {
        if (playingNoise == sample.name) {
            return;
        }
        playingNoise = sample.name;
        noisePlayer.buffer = sample.buffer;
        noisePlayer.start(0);
    };

    /**
     * Load a noise from the store and then play it right away.
     * @param {fish.Store} store is the store to load from.
     * @param {string}     name  is the key to the noise as you would normally
     *                           use to load it from the store.
     */
    this.loadNoise = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Loads a piece of audio into memory from soem url.
     * @param {strimg} url is the joint to load from.
     * @return {Promise<fish.audio.Sample>} the sound I guess assuming it
     *                                      didn't fuck up.
     */
    this.loadSample = async function (url) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        return new Promise((resolve, reject) => {
            request.onload = () => {
                context.decodeAudioData(
                    request.response,
                    buffer => {
                        resolve(new fish.audio.Sample(url, buffer));
                    },
                    () => {
                        reject(`Couldn't load sample ${url}`);
                    }
                );
            };
            request.send();
        });
    };
};

var fish = fish || {};

/**
 * Contains the base input handler and a couple of button constants that are
 * required to be handled by the gui system. If you create your input handler
 * you just need to make sure you implement uiDown and uiJustDown so that it
 * will work with the gui system.
 * @namespace
 */
fish.input = {};

/** @constant */
fish.input.UI_UP = 'UI_UP';

/** @constant */
fish.input.UI_DOWN = 'UI_DOWN';

/** @constant */
fish.input.UI_LEFT = 'UI_LEFT';

/** @constant */
fish.input.UI_RIGHT = 'UI_RIGHT';

/** @constant */
fish.input.UI_ACCEPT = 'UI_ACCEPT';

/** @constant */
fish.input.UI_CANCEL = 'UI_CANCEL';

/**
 * An input handler that unifies all input from gamepads / keyboard into one
 * abstract input which is supposed to work like a gamepad basically. It only
 * works with 1 player games for that reason.
 * @constructor
 * @param {Object.<string, string>} keymap is a mapping from html key names to
 *                                         button on the virtual controller.
 * @param {number}                         is the threshold beyond which a
 *                                         gamepad axis is considered pressed.
 */
fish.input.BasicInput = function (keymap={}, threshold = 0.9) {
    if (!keymap.UP) keymap.UP = 'ArrowUp';
    if (!keymap.DOWN) keymap.DOWN = 'ArrowDown';
    if (!keymap.LEFT) keymap.LEFT = 'ArrowLeft';
    if (!keymap.RIGHT) keymap.RIGHT = 'ArrowRight';
    if (!keymap.A) keymap.A = 'Shift';
    if (!keymap.B) keymap.B = 'z';
    if (!keymap.X) keymap.X = 'a';
    if (!keymap.Y) keymap.Y = 'x';
    if (!keymap.L) keymap.L = 'd';
    if (!keymap.R) keymap.R = 'c';
    if (!keymap.SELECT) keymap.SELECT = 'Escape';
    if (!keymap.START) keymap.START = 'Enter';
    let frame = 0;
    let keys = {};
    let buttonStates = {
        UP: false,
        DOWN: false,
        LEFT: false,
        RIGHT: false,
        X: false,
        Y: false,
        A: false,
        B: false,
        L: false,
        R: false,
        SELECT: false,
        START: false
    };
    this.UP = 'UP';
    this.DOWN = 'DOWN';
    this.LEFT = 'LEFT';
    this.RIGHT = 'RIGHT';
    this.X = 'X';
    this.Y = 'Y';
    this.A = 'A';
    this.B = 'B';
    this.L = 'L';
    this.R = 'R';
    this.SELECT = 'SELECT';
    this.START = 'START';
    document.addEventListener('keydown', (e) => {keys[e.key] = true;});
    document.addEventListener('keyup', (e) => {keys[e.key] = false;});

    /**
     * Tells you if the given button is pressed whether it is a number or
     * a button object thing.
     * @param {string|number} button is either a number or a button object thingo.
     * @return {boolean} true iff it is pressed.
     */
    let pressed = function (button) {
        if (typeof(button) == 'object') {
            return button.pressed;
        }
        return button == 1.0;
    };

    /**
     * Sets a button to the correct value based on whether it is pressed or not
     * rn.
     * @param {string}  button is the button to update.
     * @param {boolean} value  is whether or not it is pressed right now.
     */
    let updateButton = function (button, value, include=false) {
        if (include) value = value || buttonStates[button] > 0;
        if (!value) buttonStates[button] = 0;
        else if (buttonStates[button] == 0) buttonStates[button] = frame;
    };

    /**
     * Converts a ui button to an actual button on this controller thing.
     * @param {string} uiCode is the code to convert.
     * @return {string} the corresponding actual button.
     */
    let uiToButton = (uiCode) => {
        switch (uiCode) {
            case fish.input.UI_UP: return this.UP;
            case fish.input.UI_DOWN: return this.DOWN;
            case fish.input.UI_LEFT: return this.LEFT;
            case fish.input.UI_RIGHT: return this.RIGHT;
            case fish.input.UI_ACCEPT: return this.A;
            case fish.input.UI_CANCEL: return this.B;
        }
        return null;
    };

    /**
     * Just iterates the frame number.
     */
    this.update = function () {
        frame++;
        let gamepads = navigator.getGamepads ? navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        updateButton(this.A, keys[keymap.A]);
        updateButton(this.B, keys[keymap.B]);
        updateButton(this.X, keys[keymap.X]);
        updateButton(this.Y, keys[keymap.Y]);
        updateButton(this.L, keys[keymap.L]);
        updateButton(this.R, keys[keymap.R]);
        updateButton(this.SELECT, keys[keymap.SELECT]);
        updateButton(this.START, keys[keymap.START]);
        updateButton(this.UP, keys[keymap.UP]);
        updateButton(this.DOWN, keys[keymap.DOWN]);
        updateButton(this.LEFT, keys[keymap.LEFT]);
        updateButton(this.RIGHT, keys[keymap.RIGHT]);
        for (let pad of gamepads) {
            updateButton(this.A, pressed(pad.buttons[0]), true);
            updateButton(this.B, pressed(pad.buttons[1]), true);
            updateButton(this.X, pressed(pad.buttons[2]), true);
            updateButton(this.Y, pressed(pad.buttons[3]), true);
            updateButton(this.L, pressed(pad.buttons[4]), true);
            updateButton(this.R, pressed(pad.buttons[5]), true);
            updateButton(this.SELECT, pressed(pad.buttons[8]), true);
            updateButton(this.START, pressed(pad.buttons[9]), true);
            updateButton(
                this.UP,
                pressed(pad.buttons[12]) || pad.axes[1] < -threshold,
                true
            );
            updateButton(
                this.DOWN,
                pressed(pad.buttons[13]) || pad.axes[1] > threshold,
                true
            );
            updateButton(
                this.LEFT,
                pressed(pad.buttons[14]) || pad.axes[0] < -threshold,
                true
            );
            updateButton(
                this.RIGHT,
                pressed(pad.buttons[15]) || pad.axes[0] > threshold,
                true
            );
        }
    };

    /**
     * Tells you if the given input is pressed.
     * @param {string} code represents the iinput button thing.
     * @return {boolean} true if it is pressed.
     */
    this.down = function (code) {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] > 0;
    };

    /**
     * Tells you if the given input was pressed this frame I think.
     * @param {string} code is the code to represent or whatever.
     * @return {boolean} true if it was pressed this frame.
     */
    this.justDown = function (code) {
        if (!(code in buttonStates)) throw code;
        return buttonStates[code] == frame;
    };

    /**
     * Tells you if the given ui button is down.
     * @param {string} uiCode is the ui button in question.
     * @return {boolean} true if it is down now.
     */
    this.uiDown = (uiCode) => {
        return this.down(uiToButton(uiCode));
    };

    /**
     * Tells you if the given ui button just went down last frame.
     * @param {string} uiCode is the ui button in question.
     * @return {boolean} true if it just went down.
     */
    this.uiJustDown = (uiCode) => {
        return this.justDown(uiToButton(uiCode));
    };
};

var fish = fish || {};

/**
 * Class that stores assets.
 * @constructor
 * @param graphics is the graphics system which loads textures.
 * @param audio    is the audio system which loads samples.
 * @param {string} prefix   is a prefix appended to urls.
 */
fish.Store = function (graphics, audio, prefix) {
    let assets = {};
    let loaders = {
        texture: graphics.loadTexture,
        atlas: fish.graphics.loadAtlas,
        sample: audio.loadSample
    };

    /**
     * Gets a thing of arbitrary type from the asset store, or creates and adds
     * it if it cannot be found.
     * @param {string} name is the name of the thing to find.
     * @param {string} type is the type of the thing to find.
     * @return the thing if it is found or null.
     */
    let get = async function (name, type) {
        if (!(name in assets)) {
            if (type in loaders) {
                let item = await loaders[type](prefix + name);
                assets[name] = item;
            } else {
                console.error(`${type} is a not a valid asset type`);
                assets[name] = null;
            }
        }
        return assets[name];
    };

    /**
     * Gets a texture.
     * @async
     * @param {string} name is the name of the texture to get.
     * @return {fish.graphics.Texture} the texture it got.
     */
    this.getTexture = async function (name) {
        return await get(name, 'texture');
    };

    /**
     * Gets a texture atlas thingy.
     * @async
     * @param {string} name is the name of the atlas to get.
     * @return {fish.graphics.Atlas} the thingy.
     */
    this.getAtlas = async function (name) {
        return await get(name, 'atlas');
    };

    /**
     * Loads a sound sample.
     * @async
     * @param {string} name is the name of the sample to g4et.
     * @return {fish.audio.Sample} the sample or null if it screwed up.
     */
    this.getSample = async function (name) {
        return await get(name, 'sample');
    };
};

var fish = fish || {};

fish.shader = (() => {
    const defaultVertexShader = `
    attribute vec4 position;
    attribute vec4 textureCoord;
    uniform vec4 invCanvas;
    uniform vec2 invTextureSize;
    varying highp vec2 vTextureCoord;
    void main() {
        gl_Position = position * (invCanvas * vec4(2, 2, 1.0, 1.0)) - vec4(1.0, 1.0, 0, 0);
        vTextureCoord = textureCoord.xy * invTextureSize;
    }`;

    const defaultFragmentShader = `
    uniform sampler2D sampler;
    varying highp vec2 vTextureCoord;
    void main() {
        gl_FragColor = texture2D(sampler, vTextureCoord);
    }`;

    let defaultShader = null;
    let shader = {};
    
    /**
     * Loads a shader from text source.
     * @param gl     is the opengl context.
     * @param type   is the type of shader to load.
     * @param source is the text source code.
     * @return the created shader or null if it screwed up.
     */
     shader.loadShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                'Could not compiler shader: ' + gl.getShaderInfoLog(shader)
            );
            return null;
        }
        return shader;
    };

    /**
     * Creates a shader out of the source of a vertex and fragment shader.
     * @param gl          is the opengl context.
     * @param fragmentSrc is the source of the fragment shader which when null
     *                    uses a default one.
     * @param vertexSrc   is the source of the vertex shader which when null
     *                    uses a default one.
     * @return the new shader program or null if it failed.
     */
    shader.createShaderProgram = (gl, vertexSrc=null, fragmentSrc=null) => {
        const vertex = shader.loadShader(
            gl,
            gl.VERTEX_SHADER,
            vertexSrc ? vertexSrc : defaultVertexShader
        );
        const fragment = shader.loadShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentSrc ? fragmentSrc : defaultFragmentShader
        );
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(
                'Could not init shader program: ' +
                    gl.getProgramInfoLog(program)
            );
            return null;
        }
        const width = gl.canvas.clientWidth;
        const height = gl.canvas.clientHeight;
        gl.useProgram(program);
        const invCanvas = gl.getUniformLocation(program, 'invCanvas');
        gl.uniform4f(invCanvas, 1 / width, 1 / height, 1, 1);
        return {
            program: program,
            position: gl.getAttribLocation(program, 'position'),
            textureCoord: gl.getAttribLocation(program, 'textureCoord'),
            invTextureSize: gl.getUniformLocation(program, 'invTextureSize'),
            invCanvas: invCanvas,
            sampler: gl.getUniformLocation(program, 'sampler')
        };
    };

    /**
     * Binds the default shader for some nice default rendering.
     * @param gl is the opengl context.
     */
    shader.bindDefaultShader = (gl) => {
        if (defaultShader == null) {
            defaultShader = shader.createShaderProgram(gl);
        }
        gl.useProgram(defaultShader.program);
        return defaultShader;
    };

    return shader;
})();

var fish = fish || {};

/**
 * Contains the screen class and some generic types of screen that you can use
 * yourself if you want to.
 * @namespace
 */
fish.screen = {};

/**
 * Creates a screen object by taking the four things a screen needs.
 * @constructor
 * @param refresh  is a function that gets called every time the screen either
 *                 gets put on top of the screen stack, or is revealed at the
 *                 top of the screen stack.
 * @param input    is a function called when input is received, which returns
 *                 a boolean telling you whether the input was used.
 * @param update   is an instantiated coroutine which can assume to be called 60
 *                 times per second, and yields/returns other screens that it can
 *                 assume will be placed on top of the screen stack. If it
 *                 returns, it can assume itself to be removed from the stack,
 *                 which happens before any are added.
 * @param render   just renders the screen and is called whenever.
 * @param evaluate returns a value that can be passed to a screen below when
 *                 this one's update coroutine has ended. It doesn't need to
 *                 be able to return a valid value until the update thing has
 *                 ended.
 */
fish.screen.Screen = function (refresh, input, update, render, evaluate) {
    this.refresh = refresh;
    this.input = input;
    this.update = update;
    this.render = render;
    this.evaluate = evaluate;
};

/**
 * Creates a screen that only updates and renders, absorbs all input without
 * using it, and evaluates to nothing when completed.
 * @constructor
 * @implements fish.screen.Screen
 * @param refresh is the refresh function.
 * @param update  is the update coroutine.
 * @param render  is the render function.
 */
fish.screen.DullScreen = function (refresh, update, render) {
    fish.screen.Screen.call(
        this,
        refresh,
        key => {return true;},
        update,
        render,
        () => {return null;}
    );
};

/**
 * Creates a loading screen that waits for a bunch of promises to evaluate.
 * @constructor
 * @implements fish.screen.Screen
 * @param graphics    is the game graphics object used to render stuff.
 * @param after       is a function called with all the evaluated promises
 *                    which should itself evaluate to a replacement screen.
 * @param ...promises is all the promises.
 */
fish.screen.LoadScreen = function (graphics, after, ...promises) {
    let newScreen = null;
    Promise.all(promises).then(
        values => {
            
        },
        reason => {

        }
    );
    fish.screen.DullScreen.call(
        this,
        () => {},
        () => {

        },
        () => {
            graphics.clearf(
                Math.random(),
                Math.random(),
                math.random(),
                1
            );
        }
    );
};

/** @namespace */
var fish = fish || {};

/**
 * Init callback which creates the game's starting screen.
 * @callback fish~init
 * @param {Object}         cont   is the game context with all the subsystems
 *                                and stuff.
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
