import Sample from "./Sample";

/**
 * This class can help with stuff to do with playing audio like making sure
 * you don't play the same sound effect twice on the same frame or other shit
 * like that.
 */
class AudioManager {
    private playingSamples: {[name: string]: number} = {};
    private frame: number = 0;

    /**
     * Updates the frame counter so all samples can once again be played, and
     * also tries to resume the audio context if it has been paused.
     */
    update() {
        this.frame++;
    }

    /**
     * Play the given sample assuming it has not already been played this frame.
     * @param sample the sample to play.
     */
    playSample(sample: Sample): void {
        if (!sample.ready()) {
            console.error(`trying to play uninitialised sample ${sample.name}`);
        }
        if (sample.name in this.playingSamples &&
            this.playingSamples[sample.name] == this.frame
        ) {
            return;
        }
        this.playingSamples[sample.name] = this.frame;
        sample.play();
    }
}