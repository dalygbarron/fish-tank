import * as types from "./types";

export const clear = (
    gl: WebGLRenderingContext,
    colour: types.Colour
): void => {
    gl.clearColor(colour.r, colour.g, colour.b, colour.a);
    gl.clear(gl.COLOR_BUFFER_BIT);
};

export const main = (content: Screen, canvas: Canvas): void => {
    let gl: WebGLRenderingContext = canvas.getContext("webgl");
    if (gl === null) {
        alert("The FBI are coming your window!!!!! Watch out!!!");
        return;
    }
    setInterval(() => {

    }, 20);
};
