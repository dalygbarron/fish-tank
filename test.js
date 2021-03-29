class Rodent {
    constructor(sprite) {
        this.pos = new Rect(
            Math.random() * 1024,
            Math.random() * 600,
            sprite.w,
            sprite.h
        );
        this.sprite = sprite;
        this.velocity = new Vector(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        this.bounds = new Vector(1024, 600);
    }

    update() {
        this.pos.pos.add(this.velocity);
        this.pos.pos.y += 0.3;
        this.pos.pos.wrap(this.bounds);
    }
}

function go(gl) {
    const createBasedScreen = (texture) => {
        let number = 0;
        let batch = createBatch(gl, texture, 2000);
        let boxes = [];
        for (let i = 0; i < 2000; i++) {
            boxes.push(new Rodent(new Rect(
                Math.random() * texture.width - 40,
                Math.random() * texture.height - 40,
                Math.random() * 40,
                Math.random() * 40
            )));
        }
        return createDullScreen(
            (function* () {
                for (let i = 0; i < 500; i++) {
                    for (u in boxes) {
                        boxes[u].update();
                    }
                    yield;
                }
            })(),
            (gl, x, y, width, height) => {
                if (batch) {
                    batch.clear();
                    for (u in boxes) {
                        batch.add(boxes[u].sprite, boxes[u].pos);
                    }
                    batch.render();
                }
            }
        );
    };
    start(
        gl,
        createLoadScreen(createBasedScreen, loadTexture(gl, "/out.png"))
    );
}
