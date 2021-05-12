class SeizureScreen extends fish.screen.Screen {
    constructor(ctx) {
        super(ctx);
        this.timer = 10;
    }

    update(delta) {
        this.timer -= delta;
        if (this.timer <= 0) return new fish.screen.Transition(true);
    }

    render(front) {
        this.ctx.gfx.clear(
            Math.random(),
            Math.random(),
            Math.random(),
            1
        );
    }
}

class Rodent {
    constructor(sprite) {
        this.pos = new fish.util.Vector(
            Math.random() * 1024,
            Math.random() * 600
        );
        this.sprite = sprite;
        this.velocity = new fish.util.Vector(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        this.bounds = new fish.util.Vector(1024, 600);
    }

    update(delta) {
        this.pos.add(this.velocity, delta);
        this.pos.wrap(this.bounds);
    }
}

class BasedScreen extends fish.screen.Screen {
    constructor(ctx, texture, atlas) {
        super(ctx);
        this.transition = null;
        this.time = 0;
        this.texture = texture;
        this.atlas = atlas;
        this.shift = new fish.util.Vector();
        this.batch = new this.ctx.gfx.Batch(texture, 2000);
        this.boxes = [];
        this.style = {
            font: new fish.graphics.BitmapFont(this.atlas.get('otherFont')),
            panel: this.atlas.getPatch('otherPanel8'),
            button: this.atlas.getPatch('otherButton8'),
            buttonSelected: this.atlas.getPatch('otherButtonSelected8'),
            buttonDepressed: this.atlas.getPatch('otherButtonDepressed8'),
            tap: this.ctx.str.getSample('tap.wav'),
            click: this.ctx.str.getSample('click.wav')
        };
        this.panel = new fish.gui.PanelKnob(this.style);
        this.panel.addChild(new fish.gui.PanelKnob(this.style, false, [
            new fish.gui.TextKnob(this.style, 'fish-tank-demo')
        ]));
        this.panel.addChild(new fish.gui.TextKnob(
            this.style,
            `Welcome to the wonderful world of fish-tank.

            Each of the following sections is supposed to showcase some 
            different aspects of the fish-tank engine and it's fearsome
            capabilities.

            Use the arrow keys to make your selection, and then press CTRL to
            seal the deal.`
        ));
        this.panel.addChild(new fish.gui.HBoxKnob(
            this.style,
            [
                new fish.gui.PanelKnob(this.style, false, [
                    new fish.gui.TextKnob(this.style, 'Gui'),
                    new fish.gui.ButtonKnob(this.style, 'Popup menu with some controls for the background'),
                    new fish.gui.ButtonKnob(this.style, 'Reskin'),
                    new fish.gui.ButtonKnob(this.style, 'ASCII screen inside gui window')
                ]),
                new fish.gui.PanelKnob(this.style, false, [
                    new fish.gui.TextKnob(this.style, 'Audio'),
                    new fish.gui.ButtonKnob(this.style, 'Go to a screen with some annoying noises'),
                    new fish.gui.ButtonKnob(this.style, 'Play some cool music')
                ]),
                new fish.gui.PanelKnob(this.style, false, [
                    new fish.gui.TextKnob(this.style, 'Input'),
                    new fish.gui.ButtonKnob(this.style, 'a very boring game (but you can play it with a gamepad too hell yeah)')
                ]),
                new fish.gui.PanelKnob(this.style, false, [
                    new fish.gui.TextKnob(this.style, 'Graphics'),
                    new fish.gui.ButtonKnob(this.style, 'Seizure Screen', () => {
                        this.transition = new fish.screen.Transition(false, new SeizureScreen(this.ctx));
                    }),
                    new fish.gui.ButtonKnob(this.style, 'Outer Space')
                ])
            ]
        ));
        this.panel.fit(new fish.util.Rect(256, 50, 512, 400));
        for (let i = 0; i < Math.floor(500 / atlas.n()); i++) {
            this.atlas.forEach((name, sprite) => {
                this.boxes.push(new Rodent(sprite));
            });
        }
    }

    update(delta) {
        this.transition = null;
        this.time += delta;
        this.shift.x = Math.sin(this.time * 0.5) * 16;
        this.shift.y = Math.cos(this.time * 0.4) * 16;
        for (let i in this.boxes) {
            this.boxes[i].velocity.add(this.shift, delta);
            this.boxes[i].update(delta);
        }
        this.panel.update(this.ctx.in, this.ctx.snd);
        return this.transition;
    }

    render() {
        this.batch.clear();
        for (let i in this.boxes) {
            this.batch.add(this.boxes[i].sprite, this.boxes[i].pos);
        }
        this.panel.render(this.batch, true);
        this.batch.render();
    }
}

async function createBasedScreen(ctx) {
    texture = await ctx.str.getTexture('sprites.png');
    atlas = await ctx.str.getAtlas('sprites.json');
    return new BasedScreen(ctx, texture, atlas);
}

function go(gl, audio) {
    fish.normalStart(30, gl, audio, '/test/', createBasedScreen);
}

