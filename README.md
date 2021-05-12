![Logo](logo.png)
*This is the fish-tank official mascot and he is named Vabongaringo. He is 600
years old and has committed multiple war crimes for which he was never caught.*

Every browser based game library sucks real bad real good UNTIL NOW... Wahooo,
we now have fish-tank; a browser based game library that takes loose
inspiration from lua love since it's real nice but not browser based obviously.

We have:
 - Not much state.
 - Nice interfaces for default subsystems
 - you can rewrite any subsystem you want as long as you implement a small
   interface.
 - cool looking gui system.
 - batched sprite rendering on gpu with great performance.

## The Subsystems
The core functionality of the engine is in it's subsystems.
 - ctx.gfx: the renderer `fish.graphics.SpriteRenderer` by default
 - ctx.in: the input handler `fish.input.BasicInput` by default
 - ctx.snd: the sound player `fish.audio.BasicAudio` by default
 - ctx.str: the asset store `fish.store.Store` by default

Each of these has an intentionally quite specific but easy to use and nice
interface which is real nice 99% of the time since the interfaces on these
subsystems is basically the usable system that I end up building on top of
other game engine's systems when their built in interface to these features is
painful.

For example, the renderer uses gpu accelerated sprite batching which provides a
really good tradeoff between speed and clean code and programmer ease. The
input system maps all connected gamepads and the keyboard to a single imaginary
game controller which you can then poll the buttons of in your game code.

Right now the systems are pretty minimal, I might also add some more features
to them. Below is a section on adding new subsystems but there is no point
forcing people to create new subsystems just because I was too lazy to add
a few basic features, you know. If you wish they had a feature you could email
me or make a github ticket or whatever and I will discuss whether it should be
added to the built in subsystems or made into a custom subsystem. Pull Requests
would be appreciated but it's probably better if you talk to me first because
I'm not gonna merge things I don't want simply out of politeness.

Now, as I said, these easy to use systems are real nice 99% of the time, but
sometimes you need a different way of doing things, which these rather imposing
interfaces can only support to a point. This brings us to the next section.

## Implementing your own versions of the subsystems
99% of the functionality of the subsystem is only used in your actual game code
and so the engine doesn't care about it, there are just a couple of small
interfaces you will need to implement so that your new subsystem can interact
with the other ones.

For graphics, there is the `fish.graphics.BaseRenderer` interface and the
`fish.graphics.PatchRenderer` interface, I know it seems weird that there are
two but you might not actually use the same object to perform both of those
tasks and you don't have to. The base renderer interface is the for basic stuff
like filling the screen with colour, and the patch renderer is for rendering
styled rectangles and text. There is also the `fish.graphics.Font` interface
which your renderer's font implementation that it uses to draw text must
implement. This is just for getting the size of pieces of text and stuff like
that, other than that your font and text rendering system can be whatever you
want.

For audio, there is the `fish.audio.SamplePlayer` interface that requires your
audio implementation to be able to play samples on command.

For input, there is the `fish.input.UiInput` interface which requires the input
subsystem to be able to provide information about the user interacting with the
ui. It is currently only based on button presses but you can map these to
whatever buttons or inputs you want to in your implementation.

The asset store has no interface because it is only used in user code, but you
can replace it if you want to. I don't really know of a good reason to bother
though tbh.

## Starting the Game
`fish.start` takes a fairly complicated set of arguments.
