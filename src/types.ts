export interface Colour {
    r: 0,
    g: 0,
    b: 0,
    a: 0
};

/**
 * Represents a screen, update is a coroutine that updates it and expects to be
 * called 60 times per second, and render just displays the state that update
 * updates, and is called whenever.
 */
export interface Screen {
    update: Generator,
    render: Function
}
