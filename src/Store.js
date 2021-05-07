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
