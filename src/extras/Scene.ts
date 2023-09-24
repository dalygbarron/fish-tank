/**
 * Sort of like a miniature game that only takes over the screen for a
 * certain period and handles one aspect of the game, then can allow
 * others to take control when more appropriate.
 */
export default abstract class Scene {
    readonly translucent: boolean;

    /**
     * Just feeds in params.
     * @param translucent whether to render scenes below this one in
     *        the scene stack.
     */
    constructor(translucent: boolean) {
        this.translucent = translucent;
    }

    /**
     * Deletes any resources that the scene may own exclusively.
     */
    abstract free(): void;

    /**
     * Updates the scene.
     * @param delta the time step.
     */
    abstract update(delta: number): Scene;

    /**
     * Draws the scene.
     * @param time is the time since the game started. Could be useful
     *        for shaders or something.
     */
    abstract draw(time: number): void;
};