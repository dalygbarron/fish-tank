export class Colour {
    bytes = new Uint8Array(4);

    constructor(red: number, green: number, blue: number, alpha: number) {
        this.bytes[0] = red;
        this.bytes[1] = green;
        this.bytes[2] = blue;
        this.bytes[3] = alpha;
    }
}

export const TRANSPARENT_BLACK = new Colour(0, 0, 0, 0);
export const TRANSPARENT_WHITE = new Colour(255, 255, 255, 0);
export const WHITE = new Colour(255, 255, 255, 255);
export const BLACK = new Colour(0, 0, 0, 255);
export const RED = new Colour(255, 0, 0, 255);
export const GREEN = new Colour(0, 255, 0, 255);
export const BLUE = new Colour(0, 0, 255, 255);