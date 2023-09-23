import Shader from "./Shader";
import Texture from "./Texture";
import * as util from './util';
import Ajv from 'ajv';

/**
 * A thing that can load and cache assets of a certain type based on string
 * keys, and 
 */
export default abstract class Manager<T extends util.Initialised> {
    cache: {[id: string]: T} = {};

    /**
     * This is the function you must implement which actually creates or loads
     * the thingy.
     * @param key is the key that lets the manager figure out how to get it.
     *        It's probably a filename or something.
     * @returns a promise that resolves to an instance of type T and rejects if
     *          loading based on the given key and data available was not
     *          possible.
     */
    protected abstract create(key: string): Promise<T>;

    /**
     * Deletes an element from the cache and frees it's crap. If the key 
     * doesn't exist then it just does nothing.
     * @param key is the id of the element to find.
     */
    free(key: string): void {
        if (key in this.cache) {
            this.cache[key].free();
            delete this.cache[key];
        }
    }

    /**
     * Gets it to either create a new thing based on the id, or gets a pre made
     * thing. Unless the id is no good, in that case you just get null. Nulls
     * are cached too by the way so we don't have to go through the whole
     * anguish of the failed creation all over again.
     * @param key the identifier for the thing, and also whatever leads to it
     *        getting loaded.
     */
    async get(key: string): Promise<T|null> {
        if (key in this.cache) return this.cache[key];
        let result: T|null;
        await this.create(key).then(
            value => result = value,
            () => result = null
        );
        this.cache[key] = result;
        return result;
    }
}

const SHADER_JSON_SCHEMA = {
    type: "object",
    properties: {
        fragUrl: {
            type: "string"
        },
        vertUrl: {
            type: "string"
        },
        samplers: {
            type: "array"
        },
        extras: {
            type: "array"
        }
  },
  required: ["foo"],
  additionalProperties: false,
};

export class ShaderManager extends Manager<Shader> {
    gl: WebGLRenderingContext;

    /**
     * Just injects the gl rendering context dependency because it needs it to
     * set up shaders.
     * @param gl is the rendering context. 
     */
    constructor(gl: WebGLRenderingContext) {
        super();
        this.gl = gl;
    }

    protected override create(key: string): Promise<Shader> {
        return new Promise(async (resolve, reject) => {
            const text = await util.loadText(key).catch(reject);
            if (!text) return;
            const data = JSON.parse(text);
            const shader = new Shader();
            // TODO: would probably be good to enforce some kind of
            //       schema so people can't shit the bed.
            if (!shader.init(
                this.gl,
                data.fragSrc || null,
                data.vertSrc || null,
                data.samplers || ['texture'],
                data.extras || []
            )) {
                reject(`Couldn't create shader from key ${key}`);
                return;
            }
            resolve(shader);
        });    
    }
}

/**
 * A manager for textures.
 */
export class TextureManager extends Manager<Texture> {
    gl: WebGLRenderingContext;

    /**
     * Just injects the gl rendering context dependency because textures need it
     * to load.
     * @param gl is the rendering context. 
     */
    constructor(gl: WebGLRenderingContext) {
        super();
        this.gl = gl;
    }

    override create(key: string): Promise<Texture> {
        return new Promise( (resolve, reject) => {
            const texture = new Texture();
            if (texture.loadFromUrl(this.gl, key)) resolve(texture);
            else reject(`Couldn't load texture with key ${key}`)
        });
    }
}