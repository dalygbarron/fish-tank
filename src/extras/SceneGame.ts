import Game from '../Game';
import Scene from './Scene';

/**
 * This is a game object that enforces the pattern of a scene stack based game,
 * so rather than working with the game object directly, you create scenes,
 * which are sort of like small games, but they can work with each other in
 * a stack like way, you can push a scene so that it runs until it is done and
 * then returns to the scene that pushed it, or you can swap to a new scene, or
 * pop your scene, etc etc.
 */
export default class SceneGame extends Game {
    scenes: Scene[] = [];
    drawFrom: number = 0;

    override update(delta: number): void {
        if (this.scenes.length > 0) {
            this.scenes[this.scenes.length - 1].update(delta);
        } else {
            console.error('there are no scenes');
        }
    }

    override draw(time: number): void {
        for (let i = this.drawFrom; i < this.scenes.length; i++) {
            this.scenes[i].draw(time);
        }
    }

    /**
     * After the stack has been modified this figures out how many layers
     * need to be drawn.
     */
    private stackUpdate() {
        for (let i = this.scenes.length - 1; i >= 0; i--) {
            if (!this.scenes[i].translucent) {
                this.drawFrom = i;
                return;
            }
        }
        this.drawFrom = 0;
    }

    pushScene(scene: Scene): void {

    }

    popScene(): void {

    }
};