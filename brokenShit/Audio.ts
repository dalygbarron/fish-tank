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
 * Controller of all things audio within the engine.
 */
fish.audio.SoundPlayer = class {
    /**
     * @param {AudioContext} context web audio context it requires to work.
     */
    constructor(context) {
        this.context = context;
        this.songPlayer = null;
        this.noisePlayer = null;
        this.playingSong = '';
        this.playingNoise = '';
        this.playingSounds = {};
        this.frame = 0;
    }

    /** Updates the sound player. */
    update() {
        this.frame++;
    }

    /**
     * Play the given sample if possible with the given priority.
     * @param {fish.audio.Sample} sample the sample to play.
     */
    playSample(sample) {
        if (this.playingSounds[sample.name] == this.frame) return;
        this.playingSounds[sample.name] = this.frame;
        let source = this.context.createBufferSource();
        source.buffer = sample.buffer;
        source.connect(this.context.destination);
        source.start();
    }

    /**
     * Play the given song and if it is already playing then do nothing.
     * @param {fish.audio.Sample} sample is the audio to play.
     */
    playSong(sample) {
        if (this.playingSong == sample.name) return;
        this.playingSong = sample.name;
        if (this.songPlayer) this.songPlayer.stop();
        this.songPlayer = this.context.createBufferSource();
        this.songPlayer.connect(this.context.destination);
        this.songPlayer.buffer = sample.buffer;
        this.songPlayer.loop = true;
        this.songPlayer.start(0);
    }

    /** Stop the playing song. */
    stopSong() {
        this.playingSong = '';
        if (this.songPlayer) this.songPlayer.stop();
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
        if (this.playingNoise == sample.name) return;
        this.playingNoise = sample.name;
        if (this.noisePlayer) this.noisePlayer.stop();
        this.noisePlayer = this.context.createBufferSource();
        this.noisePlayer.connect(this.context.destination);
        this.noisePlayer.buffer = sample.buffer;
        this.noisePlayer.loop = true;
        this.noisePlayer.start(0);
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
                this.context.decodeAudioData(
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
     * @return {Promise<fish.audio.Sample>} the created sample.
     */
    makeSample(data) {
        return new Promise((resolve, reject) => {
            this.context.decodeAudioData(
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
    }
};
