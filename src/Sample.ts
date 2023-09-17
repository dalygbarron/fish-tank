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
     * Loads audio from a buffer of data.
     * @param ac audio context to use.
     * @param data to be converted into a sample.
     * @returns promise resolving to true iff loading was successful.
     */
    async loadFromData(ac: AudioContext, data: Uint8Array): Promise<boolean> {
        this.ac = ac;
        this.name = data.slice(0, 20).toString();
        console.log(this.name);
        return new Promise(resolve => {
            ac.decodeAudioData(
                data.buffer,
                buffer => {
                    this.buffer = buffer;
                    this.initialised = true;
                    resolve(true);
                },
                () => {
                    console.error('Failed to make sample from data');
                    resolve(false);
                }
            )
        });
    }

    /**
     * Plays the sample.
     */
    play(): void {
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