const MyGame = class extends fish.Game {
    texture = new fish.Texture();
    critter = new fish.Texture();
    shader = new fish.Shader();
    sprite = new fish.Sprite();
    batch = new fish.Batch();
    normalShader = new fish.Shader();

    constructor(gl, ac) {
        super(gl, ac);
    }

    async init() {
        await this.texture.loadFromUrl(this.gl, '/test/sprites.png');
        this.texture.setParameter(this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.texture.setParameter(this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.texture.setParameter(this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.texture.setParameter(this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        await this.critter.loadFromUrl(this.gl, '/test/critter.png');
        this.critter.setParameter(this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.critter.setParameter(this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.critter.setParameter(this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.critter.setParameter(this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        const loaded = await fish.util.loadText('/test/wavy.frag');
        this.shader.init(this.gl, loaded, null, ['texture', 'critter']);
        this.normalShader.init(this.gl);
        this.sprite.init(this.gl, new fish.util.Rect(0, 0, 512, 640), new fish.util.Rect(0, 0, 1, 1), [this.texture, this.critter]);
        this.batch.init(this.gl, this.texture, 100);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    
    update(delta) {
        // does nothing rn.
    }

    draw(time) {
        this.gl.clearColor(1, 0.6, 0.4, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.shader.update(time);
        this.shader.draw(this.sprite);
        this.batch.clear();
        for (let i = 0; i < 10; i++) {
            this.batch.addComp(this.texture.getRect(), Math.random() * 100, Math.random() * 700, Math.random() * 700, Math.random() * 700);
        }
        this.normalShader.draw(this.batch);
    }
}

async function start(gl, ac) {
    let game = new MyGame(gl, ac);
    await game.init();
    game.run(43);
}

window.onload = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ac = new AudioContext();
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2');
    await start(gl, ac);
}