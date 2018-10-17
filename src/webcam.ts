// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const defaultVideoOptions:MediaTrackConstraints = {
    facingMode: 'user',
    width: 640,
    height: 480,
    frameRate: 30
};

/**
 * utility to get a webcam feed in a video element
 * @returns Promise<HTMLVideoElement>
 */
export function getWebcam(video:HTMLVideoElement=document.createElement('video'), options:MediaTrackConstraints=defaultVideoOptions){
    if(!window.navigator.mediaDevices || !window.navigator.mediaDevices.getUserMedia) {
        return Promise.reject('Your browser does not support WebRTC. Please try another one.');
    }
    return window.navigator.mediaDevices.getUserMedia({ video: options })
        .then((mediaStream)=>{
            video.srcObject = mediaStream;
            return video;
        }, () => {
            return Promise.reject('Could not open your camera. You may have denied access.');
        });
};

const hasMediaStream = (video:HTMLVideoElement): boolean =>
    video.srcObject && video.srcObject instanceof MediaStream;

const getMediaStream = (video:HTMLVideoElement): MediaStream =>
    hasMediaStream(video) ? video.srcObject as MediaStream : null;

/**
 * stop all tracks on a video and its srcObject
 */
export const stopAllTracks = (video:HTMLVideoElement)=>{
    video.pause();
    getMediaStream(video).getTracks().forEach(track=> track.stop());
};


/**
 * WebcamCanvas simplifies initializing a WebRTC feed and rendering it to a canvas
 * it includes its own requestAnimationFrame loop using Animitter, providing
 * start(), stop() and events for 'update', 'start', 'stop' etc
 */
export class WebcamCanvas {

    public domElement:HTMLCanvasElement;
    public ctx:CanvasRenderingContext2D;
    public video:HTMLVideoElement;

    private __promiseGetWebcam:Promise<HTMLVideoElement>;
    private __promiseHasResized:Promise<void>;


    constructor(){
        this.domElement = document.createElement('canvas');
        this.domElement.classList.add('webcam');
        this.ctx = this.domElement.getContext('2d');
        this.video = document.createElement('video');

        this.resize = this.resize.bind(this);

    }

    initialize(videoOptions?:MediaTrackConstraints): Promise<WebcamCanvas> {
        //if its already initialized return the older promise for immediate resolution
        if(!this.__promiseGetWebcam || !this.__promiseHasResized){
            //the canvas has finished initializing when it has
            //a camera feed AND has resized to the cameras size

            //@ts-ignore
            this.__promiseHasResized = new Promise((resolve)=>{
                const onTimeUpdate = ()=>{
                    if(this.video.videoWidth * this.video.videoHeight < 4){
                        console.log('video not sized yet');
                        return;
                    }
                    this.resize();
                    this.video.removeEventListener('timeupdate', onTimeUpdate);
                    resolve();
                };

                this.video.addEventListener('timeupdate', onTimeUpdate);
            });

            this.__promiseGetWebcam = getWebcam(this.video, videoOptions)
                .then((video)=>{
                    //play returns a promise without any return
                    return video.play().then(()=>video)
                });
        }

        //get the webcam and resize it, return the WebcamCanvas
        //@ts-ignore
        return Promise.all([ this.__promiseGetWebcam, this.__promiseHasResized ])
            .then(()=> this);
    }

    getFrameRate(){

        const stream = getMediaStream(this.video);
        if(stream) {
            const videoTracks = stream.getVideoTracks();
            if(videoTracks && videoTracks[0]) {
                return videoTracks[0].getSettings().frameRate;
            }
        }

        return 30;
    }

    /**
     * get the image data from the canvas
     * @returns ImageData
     */
    getImageData(x:number=0, y:number=0, w:number=this.domElement.width, h:number=this.domElement.height){
        return this.ctx.getImageData(0, 0, w, h);
    }

    /**
     * update the rendering to the canvas
     * @param {Number} deltaTime, milliseconds since last update
     * @param {Number} elapsedTime, total milliseconds running
     * @param {Number} frameCount, number of updates that have occurred
     */
    update(){
        this.ctx.setTransform(-1.0, 0, 0, 1, this.domElement.width, 0); // mirrored for draw of video
        this.ctx.drawImage(this.video, 0, 0, this.domElement.width, this.domElement.height);
        this.ctx.setTransform( 1.0, 0, 0, 1, 0, 0); // unmirrored for draw of results
    }

    resize(){
        const changed = this.domElement.width !== this.video.videoWidth || this.domElement.height !== this.video.videoHeight;
        this.domElement.width = this.video.videoWidth;
        this.domElement.height = this.video.videoHeight;
        return this;
    }

    stop():Promise<void>{
        if(!this.__promiseGetWebcam){
            return Promise.resolve();
        }
        //prevent this https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
        return this.__promiseGetWebcam
            .then(()=>{
                stopAllTracks(this.video)
                this.__promiseGetWebcam = this.__promiseHasResized = null;
            });
    }
}
