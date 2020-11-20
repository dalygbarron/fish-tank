/**
 * Creates a rodent and gives a random velocity.
 * @param pos    is where it will render to on the screen.
 * @param sprite is the part of the texture atlas that it will use.
 * @return the rat.
 */
function createRodent(pos, sprite) {
    return {
        sprite: sprite,
        pos: pos,
        vel: createVector((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20)
    };
}

function go(gl) {
    const createBasedScreen = (texture) => {
        let number = 0;
        let batch = createBatch(gl, texture, 100);
        let boxes = [];
        for (let i = 0; i < 100; i++) {
            boxes.push({
                pos: createRect(0, 0, 0, 0),
                pic: createRect(
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100
                )
            });
        }
        return createDullScreen(
            (function* () {
                for (let i = 0; i < 100; i++) {
                    for (u in boxes) {
                        boxes[u].pos.w = Math.random() * 50;
                        boxes[u].pos.h = Math.random() * 50;
                        boxes[u].pos.x = Math.random() * (1024 - boxes[u].pos.w);
                        boxes[u].pos.y = Math.random() * (600 - boxes[u].pos.h);
                    }
                    yield;
                }
            })(),
            (gl, x, y, width, height) => {
                if (batch) {
                    batch.clear();
                    for (u in boxes) {
                        batch.add(boxes[u].pic, boxes[u].pos);
                    }
                    batch.render();
                }
            }
        );
    };
    start(
        gl,
        createLoadScreen(
            createBasedScreen,
            loadTexture(gl, "/waterPov.png")
        )
    );
}
