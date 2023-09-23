import * as util from './util';

/**
 * Represents a single drawable character from a font and stores info
 * about it like kerning.
 */
export class Glyph {
    src = new util.Rect();
    offset = new util.Vector2();
    advance: number;
    kerning: {[to: number]: number} = {};
}

/**
 * Quite similar to an Atlas really except it can be initialised to offset
 * everything by a certain amount, and it returns glyphs rather than a rect.
 * It uses the bmfont format for loading the data.
 */
export default class Font extends util.Initialised {
    private glyphs: {[id: number]: Glyph} = {};
    private base: number = 0;
    private lineHeight: number = 0;
    private size: number = 0;

    /**
     * Initialises the font by loading it's data from some url.
     * @param url where to get the font data.
     * @param offset is an offset to add to all glyph locations for if the font
     *        image data is inside a texture atlas or whatever.
     * @returns true iff the font was successfully loaded.
     */
    async loadFromUrl(
        url: string,
        offset: util.Vector2 = util.vectors.get()
    ): Promise<boolean> {
        const text = await util.loadText(url).catch(() => {
            console.error(`couldn't load font from ${url}`);
        });
        if (!text) {
            
            return false;
        }
        const lines = text.split('\n');
        for (const line of lines) {
            const tokens = line.split(' ');
            if (tokens.length == 0) continue;
            const type = tokens[0];
            const options:{[key: string]: number} = {};
            for (let i = 1; i < tokens.length; i++) {
                const sides = tokens[i].split('=');
                options[sides[0]] = parseInt(sides[1]);
            }
            switch (type) {
                case 'info': {
                    this.size = options.size;
                    break;
                }
                case 'common': {
                    this.lineHeight = options.lineHeight;
                    this.base = options.base;
                    break;
                }
                case 'char': {
                    const glyph = new Glyph();
                    glyph.src.pos.x = options.x + offset.x;
                    glyph.src.pos.y = options.y + offset.y;
                    glyph.src.size.x = options.width;
                    glyph.src.size.y = options.height;
                    glyph.offset.x = options.xoffset;
                    glyph.offset.y = -options.yoffset + this.base - options.height;
                    glyph.advance = options.xadvance;
                    this.glyphs[options.id] = glyph;
                    break;
                }
                case 'kerning': {
                    this.glyphs[options.first].kerning[options.second] =
                        options.amount;
                    break;
                }
            }
        }
        this.initialised = true;
        return true;
    }

    /**
     * Gives you the height of lines in this font.
     * @returns the height.
     */
    getLineHeight(): number {
        if (!this.ready()) {
            console.error('trying to get lineheight of uninitialised font');
            return 0;
        }
        return this.lineHeight;
    }

    /**
     * Gets a glyph from the font.
     * @param code character code for the glyph to retrieve.
     * @returns the glyph or null if it's not in the font.
     */
    get(code: number): Glyph|null {
        if (!this.ready()) {
            console.error('trying to use uninitialised font');
            return null;
        }
        if (code in this.glyphs) return this.glyphs[code];
        return null;
    }
}