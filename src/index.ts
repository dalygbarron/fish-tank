export interface Colour {
    r: 0,
    g: 0,
    b: 0,
    a: 0
};

export const clear = (gl: WebGLRenderingContext, colour: Colour): void => {
    gl.clearColor(colour.r, colour.g, colour.b, colour.a);
    gl.clear(gl.COLOR_BUFFER_BIT);
};
