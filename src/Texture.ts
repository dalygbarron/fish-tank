import * as util from './util'

// gl.texParameteri(
//     gl.TEXTURE_2D,
//     gl.TEXTURE_WRAP_S,
//     gl.CLAMP_TO_EDGE
// );
// gl.texParameteri(
//     gl.TEXTURE_2D,
//     gl.TEXTURE_WRAP_T,
//     gl.CLAMP_TO_EDGE
// );
// gl.texParameteri(
//     gl.TEXTURE_2D,
//     gl.TEXTURE_MIN_FILTER,
//     gl.NEAREST
// );
// gl.texParameteri(
//     gl.TEXTURE_2D,
//     gl.TEXTURE_MAG_FILTER,
//     gl.NEAREST
// );

/**
 * Wraps a webgl texture and stores it's width and height so you don't need to
 * query them whenever you need that info.
 */
export default class Texture extends util.Initialised {
    private glTexture: WebGLTexture;
    private size: util.Vector2;

    /**
     * Frees resources used by this texture and sets it as uninitialised.
     * @param gl webgl context.
     */
    free(gl: WebGLRenderingContext): void {
        if (!this.ready()) return;
        gl.deleteTexture(this.glTexture);
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
        this.free(gl);
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
                this.initialised = true;
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
     * Sets a webgl parameter for the texture.
     * @param gl webgl context.
     * @param param parameter to set.
     * @param value value to give the parameter.
     */
    setParameter(gl: WebGLRenderingContext, param: GLenum, value: number) {
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.texParameteri(gl.TEXTURE_2D, param, value);
    }

    /**
     * Gives you the size of the texture as a rectangle.
     * @returns dimensions as a rectangle with top left corner at zero.
     */
    getRect(): util.Rect {
        return new util.Rect(0, 0, this.size.x, this.size.y);
    }
};