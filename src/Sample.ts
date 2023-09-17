import * as util from './util'

/**
 * An audio sample that can be listened to.
 */
export default class Sample extends util.Initialised {
    ac: AudioContext;
    buffer: AudioBuffer;
    name: string;

    /**
     * Loads audio from a url and uses it for this sample.
     * @param ac the audio context.
     * @param url url to load audio from.
     * @returns promise resolving to true iff loading was successful.
     */
    async loadFromUrl(ac: AudioContext, url: string): Promise<boolean> {
        this.ac = ac;
        this.name = url;
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        return new Promise(resolve => {
            request.onload = () => {
                ac.decodeAudioData(
                    request.response,
                    buffer => {
                        this.buffer = buffer;
                        this.initialised = true;
                        resolve(true);
                    },
                    () => {
                        console.error(`Couldn't load sample ${url}`);
                        resolve(false);
                    }
                )
            };
            request.send();
        });
    }

    /**
     * Plays the sample.
     */
    play(): void {
        if (!this.ready()) {
            console.error(`trying to play uninitialised sample ${this.name}`);
            return;
        }
        const actuallyPlay = () => {
            let source = this.ac.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.ac.destination);
            source.start();
        }
        if (this.ac.state == 'suspended') {
            this.ac.resume().then(actuallyPlay);
        } else if (this.ac.state == 'running') {
            actuallyPlay();
        }
    }
}