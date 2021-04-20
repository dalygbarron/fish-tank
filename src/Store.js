var fish = fish || {};

/**
 * Class that stores assets.
 */
fish.Store = function (graphics, audio, prefix) {
    let assets = {
    let loaders = {
        texture: graphics.loadTexture,
        atlas: graphics.loadAtlas,
        sample: audio.loadSample
    };

    /**
     * Gets a thing of arbitrary type from the asset store, or creates and adds
     * it if it cannot be found.
     * @param name is the name of the thing to find.
     * @param type is the type of the thing to find.
     * @return the thing if it is found or null.
     */
    let get = async function (name, type) {
        if (!(name in assets)) {
            if (type in loaders) {
                let item = await loaders[type](prefix + name);
                if (item == null) {
                    console.error(`loading ${prefix}${name} failed`);
                }
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
     * @param name is the name of the texture to get.
     * @return whatever it finds which could be null if it failed.
     */
    this.getTexture = async function (name) {
        return await get(name, 'texture');
    };

    /**
     * Gets a texture atlas thingy.
     * @param name is the name of the atlas to get.
     * @return whatever it finds which could be null if it failed.
     */
    this.getAtlas = async function (name) {
        return await get(name, 'atlas');
    };

    /**
     * Loads a sound sample.
     * @param name is the name of the sample to g4et.
     * @return the sample or null if it screwed up.
     */
    this.getSample = async function (name) {
        return await get(name, 'sample');
    };
};
