const INV_MILLI = 1 / 1000;

/**
 * Contains the implementation of a game. Sorry you can't just use a single
 * function but the reason is that game logic should run on a fixed logical
 * timestep whereas rendering does not need to, so the two need to be seperated.
 */
export default abstract class Game {
    /**
     * Updates the game's logic.
     * @param delta time since last frame or whatever.
     */
    abstract update(delta: number): void;

    /**
     * Draws whatever is happening to the screen.
     * @param time is the current game time, could be handy for shaders I guess.
     */
    abstract draw(time: number): void;

    /**
     * Starts the game running.
     * @param logicalFramesPerSecond 
     */
    run(logicalFramesPerSecond: number): void {
        const delta = 1 / logicalFramesPerSecond;
        const startTime = Date.now();
        let currentTime = 0;
        let updates = 0;
        setInterval(
            () => {
                currentTime = Date.now();
                let elapsed = (currentTime - startTime) * INV_MILLI;
                while (updates < elapsed * logicalFramesPerSecond) {
                    this.update(delta);
                    updates++;
                }
                requestAnimationFrame(() => this.draw(elapsed));
            },
            delta * 1000
        );
    }
}