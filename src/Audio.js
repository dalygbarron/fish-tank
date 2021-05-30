var fish = fish || {};

/**
 * This file provides audio playing and loading functionality and a basic sound
 * player class. This player only supports playing audio files that are fully
 * loaded into memory, there is no audio streaming because it would lag and
 * suck.
 * If you need more flexible audio playing then feel free to create your own
 * class that does what you need.
 * @namespace
 */
fish.audio = {};

(() => {
    /**
     * Little thing that holds an audio buffer source and keeps track of what
     * it is being used for.
     * @private
     * @constructor
     */
    class SamplePlayer {
        constructor(context) {
            this.source = context.createBufferSource();
            this.source.connext(context.destination);
            this.playing = false;
            this.start = 0;
            this.sample = null;
            this.priority = 0;
            this.source.onended = () => {playing = false;};
        }

        /**
         * Tells you if this sample player is currently playing.
         * @return true if it is playing.
         */
        isPlaying() {
            return playing;
        }

        /**
         * Tells you the tick that the current sample started on.
         * @return the tick as a number.
         */
        getStart() {
            return start;
        }

        /**
         * Tells you the priority of the currently playing sample on this
         * thing. Keep in mind if it's not actually playing it's really not
         * that high priority.
         * @return the priority of the last played sample.
         */
        getPriority() {
            return priority;
        }

        /**
         * Play a given sample.
         * @param {fish.audio.Sample} newSample is the sample to play.
         * @param {number} newPriority is the priority to say this had.
         */
        play(newSample, newPriority) {
            playing = true;
            start = frame;
            sample = newSample;
            priority = newPriority;
            source.buffer = null;
            source.buffer = newSample.buffer;
            source.start(0);
        }

        /**
         * Tells you if a given sample is the same as the one this one is
         * playing.
         * @param sample is the sample to check.
         * @return true if they are the same and this sample player is still
         *              playing.
         */
        same(other) {
            return playing && sample && sample.name == other.name;
        }

        /**
         * Tells you if this sample player is less important than another
         * hypothetical sample player playing with the given properties.
         * @param otherPriority is the priority of the other sample player.
         * @param otherStart    is the start of the other sample player.
         * @return true if this one is less important.
         */
        lesser(otherPriority, otherStart) {
            return !playing || priority < otherPriority ||
                (priority == otherPriority && start < otherStart);
        }
    };

    /**
     * Represents a piece of fully loaded sampled audio.
     */
    fish.audio.Sample = class {
        /**
         * @param {string} name the name of the sample to keep track of it with.
         * @param {AudioBuffer} buffer the audio data.
         */
        constructor(name, buffer) {
            this.name = name;
            this.buffer = buffer;
        }
    };

    /**
     * Controller of all things audio within the engine. Very based.
     */
    fish.audio.SoundPlayer = class {
        /**
         * @param {AudioContext} context the web audio context it requires to work.
         * @param {number} [copies=2] the number of times the same sound can be
         *        playing at once.
         */
        constructor(context, copies=2) {
            this.songPlayer = null;
            this.noisePlayer = null;
            this.playingSong = '';
            this.playingNoise = '';
            this.soundPlayers = [];
            this.frame = 0;
            for (let i = 0; i < copies; i++) {
                soundPlayers.push(new SamplePlayer());
            }
        }

        /** Updates the sound player. */
        update() {
            frame++;
        }

        /**
         * Play the given sample if possible with the given priority.
         * @param {fish.audio.Sample} sample the sample to play.
         * @param {number} [priority=0] a priority level for the playing where
         *        higher numbers means more important.
         */
        playSample(sample, priority=0) {
            let chosen = -1;
            let chosenPriority = -99999;
            let chosenStart = 0;
            for (let i = 0; i < soundPlayers.length; i++) {
                if (soundPlayers[i].same(sample) &&
                    soundPlayers[i].getStart() == frame) {
                    return;
                }
                if (soundPlayers[i].lesser(chosenPriority, chosenStart)) {
                    chosen = i;
                    chosenPriority = soundPlayers[i].getPriority();
                    chosenStart = soundPlayers[i].getStart();
                }
            }
            if (chosen >= 0) {
                soundPlayers[chosen].play(sample, priority);
            }
        };

        /** @inheritDoc */
        this.getCompatability = () => {
            return new fish.Compatability(
                fish.COMPATABILITY_LEVEL.FULL,
                'lookin good fellas lets go wahooo'
            );
        };

        /**
         * Play the given song and if it is already playing then do nothing.
         * @param {fish.audio.Sample} sample is the audio to play.
         */
        playSong(sample) {
            if (playingSong == sample.name) return;
            playingSong = sample.name;
            if (songPlayer) songPlayer.stop();
            songPlayer = context.createBufferSource();
            songPlayer.connect(context.destination);
            songPlayer.buffer = sample.buffer;
            songPlayer.loop = true;
            songPlayer.start(0);
        }

        /** Stop the playing song. */
        stopSong() {
            playingSong = '';
            if (songPlayer) songPlayer.stop();
        }

        /**
         * Load a song from the store and then play it right away.
         * @param {fish.Store} store is the store to load from.
         * @param {string} name  is the key to the song as you would normally
         *        use to load it from the store.
         */
        async loadSong(store, name) {
            let sample = await store.getSample(name);
            if (sample) this.playSong(sample);
        }

        /**
         * Play the given noise and if it is already playing then do nothing.
         * @param {fish.audio.Sample} sample is the audio to play.
         */
        playNoise(sample) {
            if (playingNoise == sample.name) {
                return;
            }
            playingNoise = sample.name;
            if (noisePlayer) noisePlayer.stop();
            noisePlayer = context.createBufferSource();
            noisePlayer.connect(context.destination);
            noisePlayer.buffer = sample.buffer;
            noisePlayer.loop = true;
            noisePlayer.start(0);
        }

        /** Stop the playing song. */
        stopNoise() {
            playingNoise = '';
            if (noisePlayer) noisePlayer.stop();
        }

        /**
         * Load a noise from the store and then play it right away.
         * @param {fish.Store} store is the store to load from.
         * @param {string} name is the key to the noise as you would normally
         *        use to load it from the store.
         */
        async loadNoise(store, name) {
            let sample = await store.getSample(name);
            if (sample) this.playSong(sample);
        }

        /**
         * Loads a piece of audio into memory from soem url.
         * @param {string} url is the joint to load from.
         * @return {Promise<fish.audio.Sample>} the sound I guess assuming it
         *         didn't fuck up.
         */
        loadSample(url) {
            let request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            return new Promise((resolve, reject) => {
                request.onload = () => {
                    context.decodeAudioData(
                        request.response,
                        buffer => {
                            resolve(new fish.audio.Sample(url, buffer));
                        },
                        () => {
                            reject(`Couldn't load sample ${url}`);
                        }
                    );
                };
                request.send();
            });
        }

        /**
         * Makes a sample out of a base64 encoded string.
         * @param {Uint8Array} data is the data to make into a sample.
         * @return Promise<fish.audio.Sample>} the created sample.
         */
        makeSample(data) {
            return new Promise((resolve, reject) => {
                context.decodeAudioData(
                    data.buffer,
                    buffer => {
                        // TODO: can't just call it anon, will clash.
                        resolve(new fish.audio.Sample('anon', buffer));
                    },
                    () => {
                        reject('Could not make sampke from data');
                    }
                );
            });
        };
    };
})();



