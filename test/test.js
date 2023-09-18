const MyGame = class extends fish.Game {
    texture = new fish.Texture();
    critter = new fish.Texture();
    shader = new fish.Shader();
    sprite = new fish.Sprite();
    batch = new fish.Batch();
    normalShader = new fish.Shader();
    atlas = new fish.Atlas();
    font = new fish.Font();
    origin = new fish.util.Vector2(500, 500);

    constructor(gl, ac) {
        super(gl, ac);
    }

    async init() {
        await this.atlas.loadFromUrl('/test/sprites.json');
        await this.font.loadFromUrl('/test/yesevaOne.fnt', this.atlas.get('font').pos);
        console.log(this.font.glyphs);
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
        this.sprite.init(this.gl, fish.util.rects.get().set(0, 0, 720, 864), fish.util.rects.get().set(0, 0, 1, 1), [this.texture, this.critter]);
        this.batch.init(this.gl, this.texture, 100);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    
    update(delta) {
        this.origin.x += fish.input.getAxis('LEFT', 'RIGHT') * 200 * delta;
        this.origin.y += fish.input.getAxis('DOWN', 'UP') * 200 * delta;
    }

    draw(time) {
        this.shader.update(time);
        this.shader.draw(this.sprite);
        if (fish.input.getButton('A')) return;
        this.batch.clear();
        const dst = fish.util.vectors.get();
        // this.atlas.forEach((sprite, src) => {
        //     dst.set(
        //         this.origin.x + Math.random() * 150 - 75,
        //         this.origin.y + Math.random() * 150 - 75
        //     )
        //     this.batch.add(src, dst);
        // });
        this.batch.addText('Hello my dear friends.\nI like to bite tango lol. It is very funny.', this.origin, this.font);
        this.normalShader.draw(this.batch);
    }
}

async function start(gl, ac) {
    let game = new MyGame(gl, ac);
    await game.init();
    fish.Game.run(game, 60);
}

window.onload = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ac = new AudioContext();
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2', {alpha: false});
    await start(gl, ac);
}