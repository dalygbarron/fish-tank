import Shader from './Shader';
import Sprite from './Poster';
import * as audio from './audio';
import * as util from './util'
import * as constants from './constants';
import * as input from './input';
import { getScreenRect } from './util';
const INV_MILLI = 1 / 1000;

/**
 * Contains the implementation of a game. Sorry you can't just use a single
 * function but the reason is that game logic should run on a fixed logical
 * timestep whereas rendering does not need to, so the two need to be seperated.
 */
export default abstract class Game {
    static fps: number|null = null;
    static runningGames: Game[] = [];
    gl: WebGLRenderingContext;
    ac: AudioContext;

    /**
     * Just gives it some stuff it is gonna need.
     * @param gl webgl rendering context.
     * @param ac audio context.
     */
    constructor(gl: WebGLRenderingContext, ac: AudioContext) {
        this.gl = gl;
        this.ac = ac;
    }

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
     * Puts something on the screen saying press a key, then waits until the
     * user does to return.
     * @param gl used to write press a key on the screen.
     */
    private async pressAKey(): Promise<void> {
        const splashTexture = await constants.getPressAKeyTexture(this.gl);
        const sprite = new Sprite();
        const shader = new Shader();
        const rect = splashTexture.getRect();
        rect.pos.set(
            (this.gl.drawingBufferWidth - rect.size.x) * 0.5,
            (this.gl.drawingBufferHeight - rect.size.y) * 0.5
        );
        sprite.init(this.gl, rect, null, [splashTexture]);
        shader.init(this.gl);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        shader.draw(sprite);
        return new Promise<void>(resolve => {
            const handler = () => {
                resolve();
                window.removeEventListener('keydown', handler);
            }
            window.addEventListener('keydown', handler);
        });
    }

    /**
     * Draws the splash screen for a sec.
     * @param gl used to draw the splash screen and shit.
     */
    private async splash(): Promise<void> {
        const jingle = await constants.getJingle(this.ac);
        const splashTexture = await constants.getSplashTexture(this.gl);
        const sprite = new Sprite();
        const shader = new Shader();
        sprite.init(this.gl, util.getScreenRect(this.gl), null, [splashTexture]);
        shader.init(this.gl, constants.FADE_FRAG, null, ['texture'], ['fade']);
        jingle.play();
        for (let i = 0; i < 40; i++) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            shader.extra1f(
                'fade',
                (i < 10) ? i / 10 : (i > 30) ? (10 - (i - 30)) / 10 : 1
            );
            shader.update(i);
            shader.draw(sprite);
            await util.wait(0.09);
        }
    }

    /**
     * Starts a game running. You can have multiple game objects running at the
     * same time for if you wanted to like have a game with two screens or
     * something cool like that, but the condition is that whichever game gets
     * run first determines the framerate, so if you run a second game with this
     * function framerate will be ignored.
     * @param game is the game to set running.
     * @param logicalFramesPerSecond the number of frames per second the game
     *        is supposed to be updated at.
     * @param preload is a promise you can all which can keep evaluating while
     *        the splashscreen and stuff is happening, but it waits for it to
     *        finish before starting the main loop. You can stick a big
     *        function in here that loads all your shit.
     */
    static run(
        game: Game,
        logicalFramesPerSecond: number = 60,
        preload: Promise<any>
    ): void {
        Game.runningGames.push(game);
        if (Game.fps === null) {
            Game.fps = logicalFramesPerSecond;
        } else {
            return;
        }
        game.pressAKey().then(async () => {
            await game.splash();
            await preload;
            const delta = 1 / logicalFramesPerSecond;
            const startTime = Date.now();
            let currentTime = 0;
            let updates = 0;
            let elapsed = 0;
            const loop = () => {
                currentTime = Date.now();
                elapsed = (currentTime - startTime) * INV_MILLI;
                while (updates < elapsed * logicalFramesPerSecond) {
                    input.update();
                    audio.update();
                    util.TemporaryPool.refreshAll();
                    for (const game of Game.runningGames) {
                        game.update(delta);
                    }
                    updates++;
                }
                game.gl.clear(game.gl.COLOR_BUFFER_BIT);
                for (const game of Game.runningGames) game.draw(elapsed);
                requestAnimationFrame(loop);
            };
            loop();
        });
    }
}