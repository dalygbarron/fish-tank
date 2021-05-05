var fish = fish || {};

/**
 * Contains the screen class and some generic types of screen that you can use
 * yourself if you want to.
 * @namespace
 */
fish.screen = {};

/**
 * Creates a screen object by taking the four things a screen needs.
 * @constructor
 * @param refresh  is a function that gets called every time the screen either
 *                 gets put on top of the screen stack, or is revealed at the
 *                 top of the screen stack.
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
 */
fish.screen.Screen = function (refresh, input, update, render, evaluate) {
    this.refresh = refresh;
    this.input = input;
    this.update = update;
    this.render = render;
    this.evaluate = evaluate;
};

/**
 * Creates a screen that only updates and renders, absorbs all input without
 * using it, and evaluates to nothing when completed.
 * @constructor
 * @implements fish.screen.Screen
 * @param refresh is the refresh function.
 * @param update  is the update coroutine.
 * @param render  is the render function.
 */
fish.screen.DullScreen = function (refresh, update, render) {
    fish.screen.Screen.call(
        this,
        refresh,
        key => {return true;},
        update,
        render,
        () => {return null;}
    );
};

/**
 * Creates a loading screen that waits for a bunch of promises to evaluate.
 * @constructor
 * @implements fish.screen.Screen
 * @param graphics    is the game graphics object used to render stuff.
 * @param after       is a function called with all the evaluated promises
 *                    which should itself evaluate to a replacement screen.
 * @param ...promises is all the promises.
 */
fish.screen.LoadScreen = function (graphics, after, ...promises) {
    let newScreen = null;
    Promise.all(promises).then(
        values => {
            
        },
        reason => {

        }
    );
    fish.screen.DullScreen.call(
        this,
        () => {},
        () => {

        },
        () => {
            graphics.clearf(
                Math.random(),
                Math.random(),
                math.random(),
                1
            );
        }
    );
};
