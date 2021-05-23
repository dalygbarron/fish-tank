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

/**
 * Nice little sample object that stores it's name so we can use that for
 * stuff. You probably don't want to create one of these directly unless you
 * are creating your own audio system.
 * @constructor
 * @param name   is the name / url of the samepl.
 * @param buffer is the actual audio data.
 */
fish.audio.Sample = function (name, buffer) {
    this.name = name;
    this.buffer = buffer;
};

/**
 * Audio player which can play samples, which is the minimum required by the
 * engine.
 * @interface fish.audio.SamplePlayer
 */

/**
 * Plays a sample.
 * @method fish.audio.SamplePlayer#playSample
 * @param {fish.audio.Sample} sample the sample to play.
 * @param {number} priority determines if this sample can override others if
 *        there are limited resources.
 */

/**
 * A basic audio handler that has a music channel, a looping background sound
 * channel, and a couple of channels for playing sound effects.
 * @implements fish.audio.SamplePlayer
 * @constructor
 * @param {AudioContext} context is the audio context.
 * @param {number} players is the number of samples that can play at once.
 */
fish.audio.BasicAudio = function (context, copies=2) {
    let songPlayer = null;
    let noisePlayer = null;
    let playingSong = '';
    let playingNoise = '';
    let soundPlayers = [];
    let frame = 0;

    /**
     * Little thing that holds an audio buffer source and keeps track of what
     * it is being used for.
     * @private
     * @constructor
     */
    let SamplePlayer = function () {
        let source = context.createBufferSource();
        source.connect(context.destination);
        let playing = false;
        let start = 0;
        let sample = null;
        let priority = 0;
        source.onended = () => {playing = false;};

        /**
         * Tells you if this sample player is currently playing.
         * @return true if it is playing.
         */
        this.isPlaying = () => {
            return playing;
        };

        /**
         * Tells you the tick that the current sample started on.
         * @return the tick as a number.
         */
        this.getStart = () => {
            return start;
        };

        /**
         * Tells you the priority of the currently playing sample on this
         * thing. Keep in mind if it's not actually playing it's really not
         * that high priority.
         * @return the priority of the last played sample.
         */
        this.getPriority = () => {
            return priority;
        };

        /**
         * Play a given sample.
         * @param {fish.audio.Sample} newSample is the sample to play.
         * @param {number} newPriority is the priority to say this had.
         */
        this.play = (newSample, newPriority) => {
            playing = true;
            start = frame;
            sample = newSample;
            priority = newPriority;
            source.buffer = null;
            source.buffer = newSample.buffer;
            source.start(0);
        };

        /**
         * Tells you if a given sample is the same as the one this one is
         * playing.
         * @param sample is the sample to check.
         * @return true if they are the same and this sample player is still
         *              playing.
         */
        this.same = other => {
            return playing && sample && sample.name == other.name;
        };

        /**
         * Tells you if this sample player is less important than another
         * hypothetical sample player playing with the given properties.
         * @param otherPriority is the priority of the other sample player.
         * @param otherStart    is the start of the other sample player.
         * @return true if this one is less important.
         */
        this.lesser = (otherPriority, otherStart) => {
            return !playing || priority < otherPriority ||
                (priority == otherPriority && start < otherStart);
        };
    };

    for (let i = 0; i < copies; i++) soundPlayers.push(new SamplePlayer());

    /**
     * Updates the audio player. Needs to be done once per frame.
     */
    this.update = () => {
        frame++;
    };

    /**
     * @inheritDoc
     */
    this.playSample = (sample, priority=0) => {
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

    /**
     * Play the given song and if it is already playing then do nothing.
     * @param {fish.audio.Sample} sample is the audio to play.
     */
    this.playSong = sample => {
        if (playingSong == sample.name) {
            return;
        }
        playingSong = sample.name;
        if (songPlayer) songPlayer.stop();
        songPlayer = context.createBufferSource();
        songPlayer.connect(context.destination);
        songPlayer.buffer = sample.buffer;
        songPlayer.loop = true;
        songPlayer.start(0);
    };

    /**
     * Stop the playing song.
     */
    this.stopSong = () => {
        playingSong = '';
        if (songPlayer) songPlayer.stop();
    };

    /**
     * Load a song from the store and then play it right away.
     * @param {fish.Store} store is the store to load from.
     * @param {string}     name  is the key to the song as you would normally
     *                           use to load it from the store.
     */
    this.loadSong = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Play the given noise and if it is already playing then do nothing.
     * @param {fish.audio.Sample} sample is the audio to play.
     */
    this.playNoise = sample => {
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
    };

    /**
     * Stop the playing song.
     */
    this.stopNoise = () => {
        playingNoise = '';
        if (noisePlayer) noisePlayer.stop();
    };

    /**
     * Load a noise from the store and then play it right away.
     * @param {fish.Store} store is the store to load from.
     * @param {string} name is the key to the noise as you would normally
     *        use to load it from the store.
     */
    this.loadNoise = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Loads a piece of audio into memory from soem url.
     * @param {string} url is the joint to load from.
     * @return {Promise<fish.audio.Sample>} the sound I guess assuming it
     *         didn't fuck up.
     */
    this.loadSample = function (url) {
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
    };

    /**
     * Makes a sample out of a base64 encoded string.
     * @param {Uint8Array} data is the data to make into a sample.
     * @return Promise<fish.audio.Sample>} the created sample.
     */
    this.makeSample = function (data) {
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
