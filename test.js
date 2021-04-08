class Rodent {
    constructor(sprite) {
        this.pos = new fish.util.Rect(
            Math.random() * 1024,
            Math.random() * 600,
            sprite.w,
            sprite.h
        );
        this.sprite = sprite;
        this.velocity = new fish.util.Vector(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        this.bounds = new fish.util.Vector(1024, 600);
    }

    update() {
        this.pos.pos.add(this.velocity);
        this.pos.pos.y += 0.3;
        this.pos.pos.wrap(this.bounds);
    }
}

async function createBasedScreen(cont) {
    let number = 0;
    let texture = await cont.store.getTexture('out.png');
    let atlas = await cont.store.getAtlas('sprites.json');
    if (texture == null || atlas == null) return null;
    let batch = new cont.graphics.Batch(texture, 2000);
    let boxes = [];
    console.log(atlas.n());
    for (let i = 0; i < Math.floor(2000 / atlas.n()); i++) {
        atlas.forEach((name, sprite) => {
            boxes.push(new Rodent(sprite));
        });
    }
    return new fish.screen.DullScreen(
        () => {
            cont.audio.playSong('musicke.xm');
        },
        (function* () {
            for (let i = 0; i < 1000; i++) {
                for (u in boxes) {
                    boxes[u].update();
                }
                yield;
            }
        })(),
        () => {
            batch.clear();
            for (u in boxes) {
                batch.add(boxes[u].sprite, boxes[u].pos);
            }
            batch.render();
        }
    );
};

function go(gl, audio) {
    fish.start(gl, audio, createBasedScreen);
}
