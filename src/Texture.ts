import * as util from './util'

/**
 * Wraps a webgl texture and stores it's width and height so you don't need to
 * query them whenever you need that info.
 */
export default class Texture {
    private gl: WebGLRenderingContext;
    private glTexture: WebGLTexture;
    private size: util.Vector2;
    private invSize: util.Vector2;

    /**
     * Just puts in literally everything it uses. This is dumb to call directly.
     * @param gl webgl context.
     * @param glTexture webgl texture.
     * @param size size of the texture.
     * @param invSize (1 / width, 1 / height)
     */
    constructor(
        gl: WebGLRenderingContext,
        glTexture: WebGLTexture,
        size: util.Vector2,
        invSize: util.Vector2
    ) {
        this.gl = gl;
        this.glTexture = glTexture;
        this.size = size;
        this.invSize = invSize;
    }

    /**
     * Frees resources used by this texture and sets it as uninitialised.
     * @param gl webgl context.
     */
    free(): void {
        this.gl.deleteTexture(this.glTexture);
    }

    /**
     * Sets a webgl parameter for the texture.fas
     * @param param parameter to set.
     * @param value value to give the parameter.
     */
    setParameter(param: GLenum, value: number) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, param, value);
    }

    /**
     * Binds the texture in the webgl context.
     */
    bind(): void {
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

    /**
     * Loads a texture from a given image at a url.
     * @param gl gl context.
     * @param url where to load image data from.
     * @returns promise that resolves to a texture or rejects with an error
     *          message.
     */
    static loadFromUrl(
        gl: WebGLRenderingContext,
        url: string
    ): Promise<Texture> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const glTexture = gl.createTexture();
                if (!glTexture) {
                    reject('Failed to create webgl texture');
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
                const size = new util.Vector2().set(image.width, image.height);
                const invSize = new util.Vector2().set(
                    1 / image.width,
                    1 / image.height
                );
                const texture = new Texture(gl, glTexture, size, invSize);
                texture.setParameter(gl.TEXTURE_WRAP_T, gl.REPEAT);
                texture.setParameter(gl.TEXTURE_WRAP_S, gl.REPEAT);
                texture.setParameter(gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                texture.setParameter(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                resolve(texture);
            };
            image.onerror = () => {
                reject(`Failed loading image from ${url}`);
            };
            image.src = url;
        });
    }
};