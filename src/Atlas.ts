import * as util from './util';

/**
 * Stores a bunch of rectangles defining sub images inside one single texture,
 * and lets you access them by name.
 */
export default class Atlas extends util.Initialised {
    private sprites: {[id: string]: util.Rect} = {};

    override free(): void {
        this.sprites = {};
    }

    /**
     * Loads the atlas data from some file.
     * @param url url of the file to load from.
     * @returns promise resolving to true iff the load was successful.
     */
    async loadFromUrl(url: string): Promise<boolean> {
        // TODO: might I need to be able to handle different formats?
        return new Promise(resolve => {
            util.loadText(url).then(text => {
                const data = JSON.parse(text);
                for (const frame in data) {
                    const bounds = data[frame];
                    this.sprites[frame] = new util.Rect().set(
                        bounds.x,
                        bounds.y,
                        bounds.width,
                        bounds.height
                    );
                }
                this.initialised = true;
                resolve(true);
            }).catch(error => {
                console.error(error);
                resolve(false);
            });
        });
    }

    /**
     * Gets the named rectangle.
     * @param id the id of the rectangle to get.
     * @returns the rectangle if it exists or it gives you an empty temp one.
     */
    get(id: string): util.Rect {
        if (!this.ready()) {
            console.error('trying to use uninitialised atlas');
            return util.rects.get().set(0, 0, 1, 1);
        }
        if (id in this.sprites) return this.sprites[id];
        console.error(`unknown sprite id ${id}`);
        return util.rects.get().set(0, 0, 1, 1);
    }

    getRandom(): util.Rect {
        const keys = Object.keys(this.sprites);
        const index = Math.floor(Math.random() * keys.length);
        return this.sprites[keys[index]];
    }

    /**
     * Calls a callback on all the sprites. Probably not useful except for
     * debugging purposes.
     * @param callback the callback to call on them all.
     */
    forEach(callback: (id: string, sprite: util.Rect) => void): void {
        for (const sprite in this.sprites) {
            callback(sprite, this.sprites[sprite]);
        }
    }
}