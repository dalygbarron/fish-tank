class Rodent {
    constructor(sprite) {
        this.pos = new fish.util.Vector(
            Math.random() * 1024,
            Math.random() * 600
        );
        this.sprite = sprite;
        this.velocity = new fish.util.Vector(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        this.bounds = new fish.util.Vector(1024, 600);
    }

    update() {
        this.pos.add(this.velocity);
        this.pos.wrap(this.bounds);
    }
}

async function createBasedScreen(cont) {
    let number = 0;
    let texture = await cont.store.getTexture('out.png');
    let atlas = await cont.store.getAtlas('sprites.json');
    if (texture == null || atlas == null) return null;
    let batch = new cont.graphics.Batch(texture, 2000);
    let boxes = [];
    for (let i = 0; i < Math.floor(2000 / atlas.n()); i++) {
        atlas.forEach((name, sprite) => {
            boxes.push(new Rodent(sprite));
        });
    }
    return new fish.screen.DullScreen(
        () => {
            cont.audio.loadSong(cont.store, 'ging.ogg');
        },
        (function* () {
            for (let i = 0; i < 1000; i++) {
                for (u in boxes) {
                    if (cont.input.down(cont.input.UP)) boxes[u].velocity.y += 0.1;
                    if (cont.input.down(cont.input.DOWN)) boxes[u].velocity.y -= 0.1;
                    if (cont.input.down(cont.input.LEFT)) boxes[u].velocity.x -= 0.1;
                    if (cont.input.down(cont.input.RIGHT)) boxes[u].velocity.x += 0.1;
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
    fish.normalStart(30, gl, audio, '/test/', createBasedScreen);
}

