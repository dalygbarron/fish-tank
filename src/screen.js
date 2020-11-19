/**
 * Creates a screen object by taking the four things a screen needs.
 * @param input    is a function called when input is received, which returns
 *                 a boolean telling you whether the input was used.
 * @param update   is an instantiated coroutine which can assume to be called 60
 *                 times per second, and yields/returns other screens that it can
 *                 assume will be placed on top of the screen stack. If it
 *                 returns, it can assume itself to be removed from the stack,
 *                 which happens before any are added.
 * @param render   just renders the screen and is called whenever.
 * @param evaluate returns a value that can be passed to a screen below when
 *                 this one's update coroutine has ended. It doesn't need to
 *                 be able to return a valid value until the update thing has
 *                 ended.
 * @return the newly created screen object.
 */
const createScreen = (input, update, render, evaluate) => {
    return {
        input: input,
        update: update,
        render: render,
        evaluate: evaluate
    };
};

/**
 * Creates a screen that only updates and renders, absorbs all input without
 * using it, and evaluates to nothing when completed.
 * @param update is the update coroutine.
 * @param render is the render function.
 * @return the new screen.
 */
const createDullScreen = (update, render) => {
    return createScreen(
        (key) => {
            return true;
        },
        update,
        render,
        () => {
            return null;
        }
    );
};

