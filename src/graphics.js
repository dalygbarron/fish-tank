var fish = fish || {};

/**
 * This whole file is just a class which gets instantiated and passed to you,
 * so there is not really a reason for you to make a copy of it.
 * @param gl is the opengl context.
 */
fish.Graphics = function (gl) {
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.width = gl.canvas.clientWidth;
    this.height = gl.canvas.clientHeight;

    /**
     * Creates a texture object out of a gl texture.
     * @param glTexture is the open gl reference to the texture.
     * @param width     is the width of the texture.
     * @param height    is the height of the texture.
     */
    let Texture = function (glTexture, width, height) {
        /**
         * Gives you the opengl texture.
         * @return the opengl reference to the texture.
         */
        this.getGlTexture = () => {
            return glTexture;
        };

        /**
         * Gives you the width of the texture.
         * @return the width.
         */
        this.getWidth = () => {
            return width;
        };

        /**
         * Gives you the height of the texture.
         * @return the height.
         */
        this.getHeight = () => {
            return height;
        };
    };

    /**
     * Stores sprites.
     */
    let Atlas = function () {
        let sprites = {};

        /**
         * Adds a sprite into the atlas.
         * @param name   is the name of the atlas.
         * @param sprite is the sprite to add.
         */
        this.add = (name, sprite) => {
            sprites[name] = sprite;
        };

        /**
         * Gets a sprite out of the atlas.
         * @param name is the name of the sprite to get.
         * @return the sprite found or an empty one if it lacks it.
         */
        this.get = (name) => {
            if (name in this.sprites) return this.sprites[name];
            console.error(`unknown sprite name ${name}`);
            return new fish.util.Rect(0, 0, 0, 0);
        };

        /**
         * Tells you the number of sprites.
         * @return the number of sprites.
         */
        this.n = () => {
            return Object.keys(sprites).length;
        };

        /**
         * Iterates over all sprites in the atlas.
         * @param callback is a callback to run for each one.
         */
        this.forEach = callback => {
            for (let sprite in sprites) {
                callback(sprite, sprites[sprite]);
            }
        };
    };

    /**
     * A thing that batches draw calls.
     * @param texture is the texture all the draws must be from.
     * @param max     is the max things to draw in one go.
     */
    this.Batch = function (texture, max) {
        let items = new Float32Array(max * 12);
        let textureItems = new Float32Array(max * 12);
        let n = 0;
        let rendered = false;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            items,
            gl.DYNAMIC_DRAW
        );
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textureItems, gl.DYNAMIC_DRAW);

        /**
         * Adds a thingy to draw.
         * @param src is the source rectangle on the batch texture.
         * @param dst is where to draw it on the screen.
         */
        this.add = (src, dst) => {
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
     * Represents a colour with parts from 0 to 1.
     * @param r is the red part.
     * @param g is the green part.
     * @param b is the blue part.
     * @param a is the transparancy part.
     */
    this.Colour = function (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    };

    /**
     * Asynchronously loads a texture out of a url. I made it asynchronous
     * because * returning a test image would work quite poorly with texture
     * atlases, and it will also fuck up with other data types so we need to
     * implement asynchronous loading.
     * @param url is the url to load the texture from.
     * @return a promise which should never reject but might resolve to null if
     *         it couldn't get it's hands on the texture.
     */
    this.loadTexture = async function (url) {
        return await new Promise(resolve => {
            const image = new Image();
            image.onload = () => {
                const texture = gl.createTexture();
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
                resolve(new Texture(
                    texture,
                    image.width,
                    image.height
                ));
            };
            image.onerror = () => {
                console.error(`failed loading image ${url}`);
                resolve(null);
            };
            image.src = url;
        });
    };

    /**
     * Loads in the data part of a texture atlas.
     * @param url is the url to load it from.
     * @return the created atlas or null if it couldn't load the text or
     *         something.
     */
    this.loadAtlas = async function (url) {
        let text = await fish.util.loadText(url);
        if (text == null) return null;
        let data = JSON.parse(text);
        let atlas = new Atlas();
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
     * Clears the screen with some nice colour.
     * @param colour is the colour object.
     */
    this.clear = colour => {
        gl.clearColor(colour.r, colour.g, colour.b, colour.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    /**
     * Colour constants.
     */
    this.BLACK = new this.Colour(0, 0, 0, 1);
    this.WHITE = new this.Colour(1, 1, 1, 1);
    this.RED = new this.Colour(1, 0, 0, 1);
    this.GREEN = new this.Colour(0, 1, 0, 1);
    this.BLUE = new this.Colour(0, 0, 1, 1);
};
