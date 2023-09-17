import Shader from './Shader';
import Sprite from './Sprite';
import * as util from './util'
import * as constants from './constants';
import { getScreenRect } from './util';
const INV_MILLI = 1 / 1000;

/**
 * Contains the implementation of a game. Sorry you can't just use a single
 * function but the reason is that game logic should run on a fixed logical
 * timestep whereas rendering does not need to, so the two need to be seperated.
 */
export default abstract class Game {
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
        rect.x = (this.gl.drawingBufferWidth - rect.w) * 0.5;
        rect.y = (this.gl.drawingBufferHeight - rect.h) * 0.5;
        sprite.init(this.gl, rect, null, [splashTexture]);
        shader.init(this.gl);
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
     * Starts the game running.
     * @param logicalFramesPerSecond 
     */
    run(logicalFramesPerSecond: number): void {
        this.pressAKey().then(() => {
            this.splash().then(() => {
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
            });
        });
    }
}