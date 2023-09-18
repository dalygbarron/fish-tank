import Sample from "./Sample";

const playingSamples: {[name: string]: number} = {};
let frame = 0;

/**
 * Updates the frame counter so all samples can once again be played, and
 * also tries to resume the audio context if it has been paused. This should
 * get called automatically by the Game.run function so I wouldn't play with
 * it.
 */
export function update() {
    frame++;
}

/**
 * Play the given sample assuming it has not already been played this frame.
 * @param sample the sample to play.
 */
export function playSample(sample: Sample): void {
    if (sample.name in playingSamples && playingSamples[sample.name] == frame) {
        return;
    }
    playingSamples[sample.name] = frame;
    sample.play();
}