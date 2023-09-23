export default abstract class Scene {
    readonly translucent: boolean;

    abstract free();

    abstract update(delta: number);

    abstract draw(time: number);
};