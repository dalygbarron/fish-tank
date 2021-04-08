var fish = fish || {};

/**
 * handles audio and shiet.
 */
fish.Audio = function (context, players=3) {
    let playingSong = '';
    let playingSounds = {};
    let soundPlayers = [];




    /**
     * Nice little sample object that stores it's name so we can use that for
     * stuff.
     * @param name   is the name / url of the samepl.
     * @param buffer is the actual audio data.
     */
    let Sample = function (name, buffer) {
        this.name = name;
        this.buffer = buffer;
    };

    /**
     * Removes the record of all playing sounds.
     */
    this.refresh = function () {
        playingSounds = {};
    };

    /**
     * Plays a sample as long as it has not played since the last refresh.
     * @param sample is the sample to play.
     */
    this.playSample = function (sample) {
        if (!(sample in playingSounds)) {

        }
    };

    /**
     * Play the given song and if it is already playing then do nothing.
     * @param sample is the audio to play.
     */
    this.playSong = function (sample) {
        if (playingSong == sample.name) return;
        playingSong = sample.name;
        // TODO: join it up.
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
        request.onload = () => {
            context.decodeAudioData(request.response, buffer => {
                
            });
        };
        request.send();
    };
};
