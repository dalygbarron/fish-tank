import * as types from "./types";

export const clear = (
    gl: WebGLRenderingContext,
    colour: types.Colour
): void => {
    gl.clearColor(colour.r, colour.g, colour.b, colour.a);
    gl.clear(gl.COLOR_BUFFER_BIT);
};
