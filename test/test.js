class SeizureScreen extends fish.screen.Screen {
    constructor(ctx) {
        super(ctx);
        this.timer = 10;
        this.logo = ctx.usr.atlas.get('speedos');
        this.batch = new this.ctx.gfx.Batch(this.ctx.usr.texture, 3);
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
        this.batch.clear();
        for (let i = 0; i < 3; i++) {
            let r = Math.random() * 1024;
            let t = Math.random() * 600;
            this.batch.addComp(this.logo, 512, 300, r, t);
        }
        this.batch.render();
    }
}

class SpaceScreen extends fish.screen.Screen {
    constructor(ctx) {
        super(ctx);
        const dist = 20000;
        this.batch = new this.ctx.gfx.Batch(this.ctx.usr.texture, 512);
        this.timer = 60;
        this.star = ctx.usr.atlas.get('playerBullet');
        this.particles = [];
        for (let i = 0; i < 512; i++) {
            this.particles.push({
                x: (Math.random() - 0.5) * dist,
                y: (Math.random() - 0.5) * dist,
                z: Math.random() * dist
            });
        }
    }

    update(delta) {
        this.timer -= delta;
        if (this.timer <= 0) return new fish.screen.Transition(true);
    }

    render(front) {
        this.ctx.gfx.clear(0, 0, 0, 1);
        this.batch.clear();
        let cameraDistance = this.timer * 300;
        for (let particle of this.particles) {
            let wrappedZ = 1 / fish.util.wrap(particle.z + cameraDistance, 20000);
            let x = particle.x * wrappedZ * 1024 + 512;
            let y = particle.y * wrappedZ * 600 + 300;
            this.batch.add(this.star, new fish.util.Vector(x, y), Math.max(wrappedZ * 5000, 0.2));
        }
        this.batch.render();
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

function makeMainMenu(style, ctx) {
    let panel = new fish.gui.PanelKnob(style);
    panel.addChild(new fish.gui.PanelKnob(style, false, [
        new fish.gui.TextKnob(style, 'fish-tank-demo')
    ]));
    panel.addChild(new fish.gui.TextKnob(
        style,
        `Welcome to the wonderful world of fish-tank.

        Each of the following sections is supposed to showcase some 
        different aspects of the fish-tank engine and it's fearsome
        capabilities.

        Use the arrow keys to make your selection, and then press CTRL to
        seal the deal.`
    ));
    panel.addChild(new fish.gui.HBoxKnob(
        style,
        [
            new fish.gui.PanelKnob(style, false, [
                new fish.gui.TextKnob(style, 'Gui'),
                new fish.gui.ButtonKnob(style, 'Popup menu with some controls for the background'),
                new fish.gui.ButtonKnob(style, 'Reskin', 'reskin'),
                new fish.gui.ButtonKnob(style, 'ASCII screen inside gui window')
            ]),
            new fish.gui.PanelKnob(style, false, [
                new fish.gui.TextKnob(style, 'Audio'),
                new fish.gui.ButtonKnob(style, 'Go to a screen with some annoying noises'),
                new fish.gui.ButtonKnob(style, 'Play some cool music', async function () {
                    if (this.done) {
                        ctx.snd.stopSong();
                        this.done = false;
                        this.child.content = 'Play Some cool music';
                    } else {
                        this.done = true;
                        this.child.content = 'Loading...';
                        await ctx.snd.loadSong(ctx.str, 'ging.ogg');
                        this.child.content = 'Stop the Music';
                    }
                })
            ]),
            new fish.gui.PanelKnob(style, false, [
                new fish.gui.TextKnob(style, 'Input'),
                new fish.gui.ButtonKnob(style, 'a very boring game (but you can play it with a gamepad too hell yeah)')
            ]),
            new fish.gui.PanelKnob(style, false, [
                new fish.gui.TextKnob(style, 'Graphics'),
                new fish.gui.ButtonKnob(style, 'Seizure Screen', 'seizure'),
                new fish.gui.ButtonKnob(style, 'Outer Space', 'space')
            ])
        ]
    ));
    return panel;
}

class BasedScreen extends fish.screen.Screen {
    constructor(ctx) {
        super(ctx);
        this.styleFlip = false;
        this.transition = null;
        this.time = 0;
        this.shift = new fish.util.Vector();
        this.batch = new this.ctx.gfx.Batch(this.ctx.usr.texture, 2000);
        this.boxes = [];
        this.panel = makeMainMenu(this.ctx.usr.mainStyle, this.ctx);
        this.panel.fit(new fish.util.Rect(256, 50, 512, 400));
        for (let i = 0; i < Math.floor(500 / this.ctx.usr.atlas.n()); i++) {
            this.ctx.usr.atlas.forEach((name, sprite) => {
                this.boxes.push(new Rodent(sprite));
            });
        }
    }

    refresh() {
        //this.ctx.snd.loadNoise(this.ctx.str, 'wind.ogg');
    }

    update(delta) {
        this.time += delta;
        this.shift.x = Math.sin(this.time * 0.5) * 16;
        this.shift.y = Math.cos(this.time * 0.4) * 16;
        for (let i in this.boxes) {
            this.boxes[i].velocity.add(this.shift, delta);
            this.boxes[i].update(delta);
        }
        let result = this.panel.update(this.ctx.in, this.ctx.snd, true);
        switch (result) {
            case 'reskin':
                this.styleFlip = !this.styleFlip;
                this.panel = makeMainMenu(this.styleFlip ? this.ctx.usr.otherStyle : this.ctx.usr.mainStyle, this.ctx);
                this.panel.fit(new fish.util.Rect(256, 50, 512, 400));
                break;
            case 'seizure':
                return new fish.screen.Transition(false, new SeizureScreen(this.ctx));
            case 'space':
                return new fish.screen.Transition(false, new SpaceScreen(this.ctx));
        }
        return null;
    }

    render(front) {
        if (!front) return;
        this.batch.clear();
        for (let i in this.boxes) {
            this.batch.add(this.boxes[i].sprite, this.boxes[i].pos);
        }
        this.panel.render(this.batch, true);
        this.batch.render();
    }
}

async function createBasedScreen(ctx) {
    ctx.usr.texture = await ctx.str.getTexture('sprites.png');
    ctx.usr.atlas = await ctx.str.getAtlas('sprites.json');
    ctx.usr.mainStyle = {
        font: new fish.graphics.BitmapFont(ctx.usr.atlas.get('otherFont')),
        panel: ctx.usr.atlas.getPatch('otherPanel8'),
        button: ctx.usr.atlas.getPatch('otherButton8'),
        buttonSelected: ctx.usr.atlas.getPatch('otherButtonSelected8'),
        buttonDepressed: ctx.usr.atlas.getPatch('otherButtonDepressed8'),
        tap: await ctx.str.getSample('tap.wav'),
        click: await ctx.str.getSample('click.wav')
    };
    ctx.usr.otherStyle = {
        font: new fish.graphics.BitmapFont(ctx.usr.atlas.get('font')),
        panel: ctx.usr.atlas.getPatch('outie8'),
        button: ctx.usr.atlas.getPatch('button8'),
        buttonSelected: ctx.usr.atlas.getPatch('buttonSelected8'),
        buttonDepressed: ctx.usr.atlas.getPatch('buttonDepressed8'),
        tap: await ctx.str.getSample('tap.wav'),
        click: await ctx.str.getSample('click.wav')
    };
    return new BasedScreen(ctx);
}

function go(gl, audio) {
    fish.start({
        rate: 30,
        gl: gl,
        ac: audio,
        storePrefix: '/test/'
    }, createBasedScreen);
}

