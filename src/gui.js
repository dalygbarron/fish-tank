var fish = fish || {};

/**
 * This file provides a kinda basic gui system for the user to interact with.
 * It only uses button input by default but it should be able to do menu type
 * stuff as well as game dialogue and basic hud if need be etc.
 * @namespace
 */
fish.gui = {};

/*
 * Ok so how the hell am I gonna do this? The gui system needs to be set up so
 * that it can work with any renderer. Well, actually so it doesn't need to
 * work with the overall renderer in the case of the sprite renderer, it needs
 * to work with the sprite batch, and it also needs to know which sprites are
 * used for what parts of itself.
 * For sound it just needs to have a sound and be able to play it on the sound
 * player.
 * For input it needs to query a couple of things which I have already set up.
 * So yeah, main thing is graphics. Basically, I think I should make it that
 * you can only have one sprite atlas per sprite renderer because it's gonna be
 * a massive pain otherwise. eh but you need the renderer object to load
 * textures rn so that would suck.
 * So no, you can have as many as you want, but when you create guis you need
 * to pass them some kind of theme object which defines the sounds to play and
 * the sprites to draw with etc, and these sprites are obviously going to
 * presume that you are using some certain texture so if you ain't it's gonna
 * look pretty fucked up.
 * Yeah so then each frame you have to call update on your gui like you
 * generally would and in the render function you will call render on it while
 * passing it the batch that it will draw with.
 *
 * There are some other questions like what widgets there will be and how it
 * will be arranged etc etc but that is for antoher time.
 */
