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
        this.pos.x += this.velocity.x * delta;
        this.pos.y += this.velocity.y * delta;
        this.pos.wrap(this.bounds);
    }
}

class BasedScreen extends fish.screen.Screen {
    constructor(ctx, texture, atlas) {
        super(ctx);
        this.texture = texture;
        this.atlas = atlas;
        this.shift = new fish.util.Vector();
        this.batch = new this.ctx.gfx.Batch(texture, 2000);
        this.boxes = [];
        this.patch = this.atlas.getPatch('outie8');
        this.font = new fish.graphics.BitmapFont(this.atlas.get('font'));
        console.log(this.patch);
        this.region = new fish.util.Rect(50, 50, 500, 200);
        for (let i = 0; i < Math.floor(500 / atlas.n()); i++) {
            this.atlas.forEach((name, sprite) => {
                this.boxes.push(new Rodent(sprite));
            });
        }
    }

    refresh() {
        this.ctx.snd.loadSong(this.ctx.str, 'ging.ogg');
    }

    update(delta) {
        this.shift.x = 0;
        this.shift.y = 0;
        if (this.ctx.in.down(this.ctx.in.BUTTONS.UP)) this.shift.y = 32;
        if (this.ctx.in.down(this.ctx.in.BUTTONS.DOWN)) this.shift.y = -32;
        if (this.ctx.in.down(this.ctx.in.BUTTONS.LEFT)) this.shift.x = -32;
        if (this.ctx.in.down(this.ctx.in.BUTTONS.RIGHT)) this.shift.x = 32;
        for (let i in this.boxes) {
            this.boxes[i].velocity.x += this.shift.x * delta;
            this.boxes[i].velocity.y += this.shift.y * delta;
            this.boxes[i].update(delta);
        }
        return null;
    }

    render() {
        this.batch.clear();
        for (let i in this.boxes) {
            this.batch.add(this.boxes[i].sprite, this.boxes[i].pos);
        }
        this.batch.addPatch(this.patch, this.region);
        this.batch.addText(
            this.font,
            'cunt CUNT CUNT cunr FUCKING PIG\nI am going to GUT you CUNT',
            new fish.util.Vector(100, 100)
        );
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

