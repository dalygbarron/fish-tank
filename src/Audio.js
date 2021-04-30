/**
 * This file provides audio playing and loading functionality and a basic sound
 * player class. This player only supports playing audio files that are fully
 * loaded into memory, there is no audio streaming because it would lag and
 * suck.
 * If you need more flexible audio playing then feel free to create your own
 * class that does what you need.
 */

var fish = fish || {};
fish.audio = {};

/**
 * Nice little sample object that stores it's name so we can use that for
 * stuff. You probably don't want to create one of these directly unless you
 * are creating your own audio system.
 * @param name   is the name / url of the samepl.
 * @param buffer is the actual audio data.
 */
fish.audio.Sample = function (name, buffer) {
    this.name = name;
    this.buffer = buffer;
};

/**
 * A basic audio handler that has a music channel, a looping background sound
 * channel, and a couple of channels for playing sound effects.
 */
fish.audio.BasicAudio = function (context, players=3) {
    let songPlayer = context.createBufferSource();
    let noisePlayer = context.createBufferSource();
    songPlayer.connect(context.destination);
    noisePlayer.connect(context.destination);
    let playingSong = '';
    let playingNoise = '';
    let soundPlayers = [];
    let frame = 0;

    /**
     * Little thing that holds an audio buffer source and keeps track of what
     * it is being used for.
     */
    let SamplePlayer = function () {
        let source = context.createBufferSource();
        source.connect(context.destination);
        let playing = false;
        let start = 0;
        let sample = null;
        let priority = 0;

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
         * @param sample   is the sample to play.
         * @param priority is the priority to say this had.
         */
        this.play = (sample, priority) => {
            playing = true;
            start = frame;
            sample = sample;
            priority = priority;
            source.buffer = sample.buffer;
            source.start(0);
            source.onended = () => {playing = false;};
        };

        /**
         * Tells you if a given sample is the same as the one this one is
         * playing.
         * @param sample is the sample to check.
         * @return true if they are the same and this sample player is still
         *              playing.
         */
        this.same = sample => {
            return playing && sample && sample.name == this.sample.name;
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

    for (let i = 0; i < players; i++) soundPlayers.push(new SamplePlayer());

    /**
     * Updates the audio player. Needs to be done once per frame.
     */
    this.update = () => {
        frame++;
    };

    /**
     * Plays a sample as long as it has not played since the last refresh.
     * @param sample   is the sample to play.
     * @param priority is it's priority so it can play over things of lesser
     *                 importance.
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
     * @param sample is the audio to play.
     */
    this.playSong = sample => {
        if (playingSong == sample.name) {
            return;
        }
        playingSong = sample.name;
        songPlayer.buffer = sample.buffer;
        songPlayer.start(0);
    };

    /**
     * Load a song from the store and then play it right away.
     * @param store is the store to load from.
     * @param name  is the key to the song as you would normally use to load it
     *              from the store.
     */
    this.loadSong = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Play the given noise and if it is already playing then do nothing.
     * @param sample is the audio to play.
     */
    this.playNoise = sample => {
        if (playingNoise == sample.name) {
            return;
        }
        playingNoise = sample.name;
        noisePlayer.buffer = sample.buffer;
        noisePlayer.start(0);
    };

    /**
     * Load a noise from the store and then play it right away.
     * @param store is the store to load from.
     * @param name  is the key to the noise as you would normally use to load
     *              it from the store.
     */
    this.loadNoise = async function (store, name) {
        let sample = await store.getSample(name);
        if (sample) this.playSong(sample);
    };

    /**
     * Loads a piece of audio into memory from soem url.
     * @param url is the joint to load from.
     * @return the sound I guess assuming it didn't fuck up, then it return
     * a promise? hmmm.
     */
    this.loadSample = async function (url) {
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
};
