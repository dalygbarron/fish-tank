import * as util from './util'

/**
 * Wraps a webgl texture and stores it's width and height so you don't need to
 * query them whenever you need that info.
 */
export default class Texture extends util.Initialised {
    private gl: WebGLRenderingContext;
    private glTexture: WebGLTexture;
    private size = new util.Vector2();
    private invSize = new util.Vector2();

    /**
     * Frees resources used by this texture and sets it as uninitialised.
     * @param gl webgl context.
     */
    free(): void {
        if (!this.ready()) return;
        this.gl.deleteTexture(this.glTexture);
        this.initialised = false;
    }

    /**
     * Loads data for the texture from the given url. If it already has some
     * data then it frees it.
     * @param gl webglrendering context to upload the texture data into.
     * @param url where to load the image data from.
     * @returns a promise that should evaluate to true iff the texture was
     *          successfully loaded. Should never reject, if there is a failure
     *          then it should evaluate to false and log an error.
     */
    async loadFromUrl(
        gl: WebGLRenderingContext,
        url: string
    ): Promise<boolean> {
        this.free();
        this.gl = gl;
        return await new Promise(resolve => {
            const image = new Image();
            image.onload = () => {
                const glTexture = gl.createTexture();
                if (!glTexture) {
                    console.error('failed to create webgl texture');
                    resolve(false);
                    return;
                }
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image
                );
                this.glTexture = glTexture;
                this.size.set(image.width, image.height);
                this.invSize.set(1 / image.width, 1 / image.height);
                this.initialised = true;
                this.setParameter(this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
                this.setParameter(this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
                this.setParameter(this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                this.setParameter(this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                resolve(true);
                return;
            };
            image.onerror = () => {
                console.error(`Failed loading image from ${url}`);
                resolve(false);
                return;
            }
            image.src = url;
        });
    }

    /**
     * Sets a webgl parameter for the texture.fas
     * @param param parameter to set.
     * @param value value to give the parameter.
     */
    setParameter(param: GLenum, value: number) {
        if (!this.ready()) {
            console.error('trying to set param on uninitialised texture');
            return;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, param, value);
    }

    /**
     * Binds the texture in the webgl context.
     */
    bind(): void {
        if (!this.ready()) {
            console.error('trying to bind uninitialised texture');
            return;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
    }

    /**
     * Tells you the texture's width.
     * @returns width number.
     */
    getWidth(): number {
        return this.size.x;
    }

    /**
     * tells you the texture's height.
     * @returns height number.
     */
    getHeight(): number {
        return this.size.y;
    }

    /**
     * gives you the inverse width.
     * @returns 1 / width.
     */
    getInvWidth(): number {
        return this.invSize.x;
    }

    /**
     * gives you the inverse height.
     * @returns 1 / height
     */
    getInvHeight(): number {
        return this.invSize.y;
    }

    /**
     * Gives you the size of the texture as a temporary rectangle.
     * @returns dimensions as a rectangle with top left corner at zero.
     */
    getRect(): util.Rect {
        return util.rects.get().set(0, 0, this.size.x, this.size.y);
    }
};