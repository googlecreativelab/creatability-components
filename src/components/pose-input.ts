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

import autobind from 'autobind-decorator';
import * as posenet from '@tensorflow-models/posenet';
import { backgroundColor } from './styles';
import { computeStyleResult, cssColorToArray } from './../utils';
import { vec2, copy, add, sub, scale } from './../vec2';
import { scaleToFill, clamp, setBooleanAttribute } from './../utils';
import { InputType, Animitter } from './types';
import { html } from '@polymer/lit-element';
import { ACCInputEvent, InputEventDetails } from '../events/input-event';
import { AbstractInputElement } from './abstract-input';
import { WebcamCanvas } from '../webcam';
import { scalemap } from '../utils';
import { property } from './decorators';
import { MobileNetMultiplier } from '@tensorflow-models/posenet/dist/mobilenet';
import './tutorial';

const animitter = require('animitter');


interface KeypointMap {
    [name: string]: vec2;
}

/**
 * used in order to focus on calibration panel header without strict casting
 * @param c
 */
const canFocusHeader = (c:any): c is { focusHeader: ()=>void } =>
    typeof c.focusHeader === 'function';

/**
 * is an element that has width and height attributes like canvas or image
 * @param v
 */
const isPixelResolutionElement = (v: any): v is { width: number, height: number } =>
    typeof v.width === 'number' && v.height === 'number';

/**
 * Get the dimensions of the provided element
 * @param element an Element to get the dimensions of
 * @param result optionally provide an array to fill as a vector to reduce garbage
 */
const getElementDimensions = (element: Element, result: vec2 = [0, 0]): vec2 => {
    if (isPixelResolutionElement(element)) {
        result[0] = element.width;
        result[1] = element.height;
        return result;
    }
    if (Math.min(element.clientWidth, element.clientHeight) > 0) {
        result[0] = element.clientWidth;
        result[1] = element.clientHeight;
        return result;
    }

    const bcr = element.getBoundingClientRect();

    if(Math.min(bcr.width, bcr.height) > 0) {
        result[0] = bcr.width;
        result[1] = bcr.height;
        return result;
    }

    return result;
}

const _tmpVec2: vec2 = [NaN, NaN];
const _tmpScaleBounds = {};
/**
 * mutate the provided points to be scaled and offset to the destination canvas
 * @param {*} canvas
 * @param {Array<[number,number]>} nestedPoints
 * @param {*} result
 */
export const transformCameraPoints = (
    inWidth: number, inHeight: number,
    outWidth: number, outHeight: number,
    nestedPoints: vec2[]) => {

    const { scale, left, top } = scaleToFill(inWidth, inHeight, outWidth, outHeight, 0, _tmpScaleBounds);

    for(let i=0; i<nestedPoints.length; i++){
        const point = nestedPoints[i];
        let [x, y] = point;
        x *= scale;
        y *= scale;
        x += left;
        y += top;
        point[0] = x;
        point[1] = y;
    }
    return nestedPoints;
};


const keypointPartsMap: any = {
    'nose': 'Nose',
    'leftEye': 'Right Eye',
    'rightEye': 'Left Eye',
    'leftEar': 'Right Ear',
    'rightEar': 'Left Ear',
    'leftShoulder': 'Right Shoulder',
    'rightShoulder': 'Left Shoulder',
    'leftElbow': 'Right Elbow',
    'rightElbow': 'Left Elbow',
    'leftWrist': 'Right Wrist',
    'rightWrist':'Left Wrist',
    'leftHip': 'Right Hip',
    'rightHip': 'Left Hip',
    'leftKnee': 'Right Knee',
    'rightKnee': 'Left Knee',
    'leftAnkle': 'Right Ankle',
    'rightAnkle': 'Left Ankle'
};

//pre-defined parts that come with posenet
export const keypointParts = [
    'nose',
    'leftEye',
    'rightEye',
    'leftEar',
    'rightEar',
    'leftShoulder',
    'rightShoulder',
    'leftElbow',
    'rightElbow',
    'leftWrist',
    'rightWrist',
    'leftHip',
    'rightHip',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle'
];


const selectableParts = [
    'nose',
    'leftWrist',
    'rightWrist',
    'leftElbow',
    'rightElbow',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle'
];

const selectablePartsDisplay = selectableParts.map(key=> keypointPartsMap[key]);

//all parts
export const parts = keypointParts;

export interface PoseInputEventDetails extends InputEventDetails {
    pose:posenet.Pose;
    bodyPart:string;
}

type PoseInputEventInit = CustomEventInit<PoseInputEventDetails>;

export class ACCPoseInputEvent extends ACCInputEvent {
    constructor(type:string, eventInit:PoseInputEventInit){
        super(type, eventInit);
    }
}

// let constraints = {
//     audio: false,
//     video: {
//         advanced: [
//             { width: { exact: 400 } },
//             { height: { exact: 400 } },
//         ]
//     }
//  }

const _tmpContentDims: [number, number] = [NaN, NaN];

/**
 * `<acc-pose-input>` element easily adds PoseNet based tracking for controlling
 * the cursor position on a webpage with a chosen body part of the user.
 * For example with a couple lines of code, a user's nose can be used to control
 * a webpage.
 *
 * @example ```html
 *
 * <acc-pose-input amplification="2" smoothing="0.5" bodyPart="nose"></acc-pose-input>
 * ```
 */
export class PoseInputElement extends AbstractInputElement {

    @property({ type: String })
    public label:string = 'Body';

    public inputType:InputType = 'pose';
    public pose:posenet.Pose;


    public preamplifiedTargetPosition: vec2 = [0, 0];

    @property({ type: Number })
    public amplification:number = 1;

    @property({ type: String })
    public bodyPart:string = 'nose';

    @property({ type: String })
    public target:string = '';

    @property({ type: Number })
    public multiplier:MobileNetMultiplier = 1.01;//0.75;

    @property({ type: Number })
    public imageScaleFactor:number = 0.33;

    /**
     * show the help modal, has priority over controls
     */
    @property({ type: Boolean })
    public help: boolean = false;


    @property({ type: Number })
    public keypointEase: number = 0.5;

    /**
     * this input has a cointrols panel
     */
    public get hasControls() {
        return true;
    }

    protected _estimating:boolean;
    protected _webcamCanvas:WebcamCanvas = new WebcamCanvas();
    protected _loop:Animitter = animitter();
    protected _input:posenet.PoseNet;

    public sourceCenter: vec2;

    private __estimating: boolean;

    /**
     * holds a dictionary of all tracked keypoints, in source (webcam) coordinates
     * points are all eased by keypointEase
     */
    private __easedKeypointMap: KeypointMap = {};

    private __lastSourcePosition: vec2 = [0, 0];



    constructor(){
        super();
        this._loop.on('update', this._handleNewFrame);
        this._loop.on('start', this._dispatchReady);
        this._loop.on('stop', this._handleStop);
    }

    /**
     * overriding AbstractInputElement#_createEvent to provide extra details
     * @param type
     * @param bubbles
     * @param composed
     */
    protected _createEvent(type:string, bubbles:boolean=true, composed:boolean=true){
        const eventInit:PoseInputEventInit = {
            detail: {
                inputType: this.inputType,
                position: this.position,
                bodyPart: this.bodyPart,
                pose:this.pose,
            },
            bubbles,
            //send outside of shadow to parent element
            composed
        };

        return new ACCInputEvent(type, eventInit);
    }


    computePartPosition(part:string, result: vec2=[NaN,NaN]): vec2 {
        if(!this.pose || !this.pose.keypoints){
            result[0] = result[1] = NaN;
            return result;
        }


        let x: number;
        let y: number;

        if(part === 'sternum'){
            const leftSh = this.pose.keypoints[5].position;
            const rightSh = this.pose.keypoints[6].position;
            x = (leftSh.x - rightSh.x) * 0.5 + rightSh.x;
            y = (leftSh.y - rightSh.y) * 0.5 + rightSh.y;
        } else {
            const p = this.pose.keypoints[keypointParts.indexOf(part)].position;
            x = p.x;
            y = p.y;
        }

        result[0] = x;
        result[1] = y;
        return result;
    }

    getPartPosition(part: string, result: vec2= [NaN, NaN]): vec2 {
        //return this.computePartPosition(part, result);
        const src = this.__easedKeypointMap[part];
        if(src) {
            result[0] = src[0];
            result[1] = src[1];
        }
        return result;
    }

    getPartPositionNormalized(part:string, result: vec2=[NaN, NaN]): vec2 {
        const pos = this.getPartPosition(part, result);

        const x = scalemap(pos[0], 0, this.canvas.width, -1, 1);// * this.amplification;
        const y = scalemap(pos[1], 0, this.canvas.height, -1, 1);// * this.amplification;
        result[0] = x;
        result[1] = y;
        return result;
    }

    /**
     * Get the position of the body part projected into the coordinate space of the target element
     * @param part the body part key to receive the position of
     * @param targetElement optionally provide an Element if you wish to use one other than the target
     */
    getPartPositionProjected(part: string, targetElement:Element= this.contentElement): vec2 {
        return this.projectPosition(this.getPartPosition(part), targetElement);
    }

    /**
     * Project (mutate) a position from source (webcam) coordinates to an elements coordinates
     * @param position a vector in source (webcam) coordinates
     * @param targetElement optionally provide an Element to project to other than target element
     */
    projectPosition(position: vec2, targetElement: Element= this.contentElement): vec2 {
        const [ width, height ] = getElementDimensions(targetElement);
        return transformCameraPoints(this.canvas.width, this.canvas.height, width, height, [position])[0];
    }

    get canvas(){
        return this._webcamCanvas.domElement;
    }

    async initialize(){
        this._dispatchInitializing();
        if(/(iPad|iPhone|Crios)/g.test(navigator.userAgent)) {
            const err = new Error('Body tracking is not supported on iOS.');
            this._dispatchError(err);
            throw err;
        }
        if (!this._input) {
            this._input = await posenet.load(this.multiplier);
        }
        try {
            await this._webcamCanvas.initialize();
        } catch(e) {
            this._dispatchError(new Error(e)); //'Error initializing camera. Please ensure you have one and haven\'t denied access.');
            throw e;
        }
        if(!this.sourceCenter) {
            this.resetCenter();
        }
        this._loop.setFPS(this._webcamCanvas.getFrameRate());
        this._loop.start();
    }


    @autobind
    protected _handleStop(){
        //when the input stops, shut down the camera and undo all initialization
        this._dispatchStop();
        this._webcamCanvas.stop();
    }

    @autobind
    protected _handleNewFrame(){
        //if a new frame occurs while still estimating the last pose
        //skip this frame
        if(this.__estimating){
            return;
        }
        this._updatePose();
    }

    public _propertiesChanged(props: any, changed: any, prev: any) {
        super._propertiesChanged(props, changed, prev);
        if(changed && changed.hasOwnProperty('help')) {
            setBooleanAttribute(this, 'help', props.help);
            this._dispatchChange();
        }
    }


    protected async _updatePose(){
        const outputStride = 16;
        const flipHorizontal = false;
        const maxPoseDetections = 1;

        this._estimating = true;
        this._webcamCanvas.update();
        const poses = await this._input.estimateMultiplePoses(this._webcamCanvas.domElement, this.imageScaleFactor, flipHorizontal, outputStride, maxPoseDetections);
        const pose = poses[0];
        this._estimating = false;
        this.pose = pose;

        if(this.pose){
            const _tmp: vec2 = [NaN, NaN];
            //update all keypoints positions, and ease them by parameter
            for (let i= 0; i<keypointParts.length; i++) {
                const key: string = keypointParts[i];
                const position = this.computePartPosition(key);
                const lastPosition = this.__easedKeypointMap[key];
                if (lastPosition && !isNaN(lastPosition[0]) && !isNaN(lastPosition[1])) {
                    const easedDifference = scale(sub(position, lastPosition, _tmp), this.keypointEase, _tmp);
                    add(lastPosition, easedDifference, lastPosition);
                } else {
                    this.__easedKeypointMap[key] = position;
                }
            }
            if(this.contentElement){
                //the source coordinate from webcam (likely 640x480)
                const partPosition = this.getPartPosition(this.bodyPart);

                //calculate the position projected to the target,
                //but before any amplification has been computed
                copy(partPosition, this.preamplifiedTargetPosition);
                this.projectPosition(this.preamplifiedTargetPosition);

                const distanceFromCenter = sub(partPosition, this.sourceCenter);
                const amplifiedDistance = scale(distanceFromCenter, this.amplification);

                //update partPosition to being the amplified position still in source coordinates
                add(this.sourceCenter, amplifiedDistance, this.__lastSourcePosition);
                add(this.sourceCenter, amplifiedDistance, this._lastFoundTargetPosition);
                //set the projected position
                this.projectPosition(this._lastFoundTargetPosition);
                if (!this.disableClamp) {
                    const dims = getElementDimensions(this.contentElement, _tmpContentDims)
                    this._lastFoundTargetPosition[0] = clamp(this._lastFoundTargetPosition[0], 0, dims[0]);
                    this._lastFoundTargetPosition[1] = clamp(this._lastFoundTargetPosition[1], 0, dims[1]);
                }

            }
            this._lastFoundPosition = this.getPartPositionNormalized(this.bodyPart);
        }

        this._dispatchTick();
    }

    /**
     * Returns an object of the project positions for every part
     * @param keypoints optionally provide a list of bodyPart keys to project, defaults to all
     * @param targetElement optionally project an Element to project coordinates too, defaults to target
     */
    public getAllPositionsProjected(keypoints: string[]= keypointParts, targetElement: Element= this.contentElement) {


        const [ width, height ] = getElementDimensions(targetElement);

        return keypoints.reduce((mem: any, part: string) => {
            if(!mem[part]) {
                mem[part] = transformCameraPoints(640, 480, width, height, [this.getPartPosition(part)])[0];
            }
            return mem;
        }, {});
    }

    /**
     * render a crosshair of the input's center calibration point
     * @param ctx
     * @param style
     * @param lineWidth
     * @param radius
     * @param crossLength
     */
    public renderCenter(ctx: CanvasRenderingContext2D, style: string= 'black', lineWidth: number= 3, radius: number= 16, crossLength: number= 8) {
        if(!this.isReady) {
            return;
        }

        copy(this.sourceCenter, _tmpVec2);
        const center = this.projectPosition(_tmpVec2, ctx.canvas);
        let x = 0;
        let y = 0;

        ctx.strokeStyle = style;
        ctx.lineWidth = lineWidth;

        // cross-hair scope design
        // ctx.beginPath();
        // ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
        // x = center[0] + radius;
        // y = center[1];
        // ctx.moveTo(x, y);
        // ctx.lineTo(x + crossLength, y);

        // x = center[0] - radius;
        // ctx.moveTo(x - crossLength, y);
        // ctx.lineTo(x, y);

        // x = center[0];
        // y = center[1] - radius;
        // ctx.moveTo(x, y);
        // ctx.lineTo(x, y - crossLength);

        // y = center[1] + radius;
        // ctx.moveTo(x, y);
        // ctx.lineTo(x, y + crossLength);


        ctx.beginPath();
        ctx.moveTo(center[0] - radius, center[1]);
        ctx.lineTo(center[0] + radius, center[1]);
        ctx.moveTo(center[0], center[1] - radius);
        ctx.lineTo(center[0], center[1] + radius);

        ctx.stroke();
    }


    public renderCursor(ctx: CanvasRenderingContext2D, style='blue') {
        if (!this.isReady) {
            return;
        }
        const { __lastSourcePosition:source } = this;
        const [x1, y1] = this.projectPosition(this.getPartPosition(this.bodyPart), ctx.canvas);
        const [x2, y2] = this.projectPosition(source, ctx.canvas);
        ctx.strokeStyle = ctx.fillStyle = style;
        //line connecting source dot to amplified dot
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        //circle representing cursor
        ctx.beginPath();
        ctx.arc(x2, y2, 16, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * render the pose data to a canvas to show current tracked skeleton
     * @param ctx
     * @param style
     * @param radius
     */
    public renderInputData(ctx: CanvasRenderingContext2D, style: string= 'rgba(96,96,96, 0.85)', radius: number= 4) {
        if (!this.isReady) {
            return;
        }

        const segments: string[][] = [
            ['nose'],
            ['leftShoulder', 'rightShoulder', 'rightHip', 'leftHip', 'leftShoulder'],
            ['leftShoulder', 'leftElbow', 'leftWrist'],
            ['rightShoulder', 'rightElbow', 'rightWrist']
        ];

        ctx.strokeStyle = ctx.fillStyle = style;

        const currentPosition: vec2 = [NaN, NaN];

        const partsRendered: string[] = [];


        segments.forEach((segment: string[]) => {
            if(segment.length > 1){
                ctx.beginPath();
                segment.forEach((bodyPart: string, i: number) => {
                    this.getPartPosition(bodyPart, currentPosition);
                    this.projectPosition(currentPosition, ctx.canvas);
                    if (i === 0) {
                        ctx.moveTo(currentPosition[0], currentPosition[1]);
                    } else {
                        ctx.lineTo(currentPosition[0], currentPosition[1]);
                    }
                });

                ctx.stroke();
            }

            segment.forEach((bodyPart: string) => {
                if(partsRendered.indexOf(bodyPart) !== -1){
                    return;
                }
                this.getPartPosition(bodyPart, currentPosition);
                this.projectPosition(currentPosition, ctx.canvas);
                ctx.beginPath();
                ctx.arc(currentPosition[0], currentPosition[1], radius, 0, Math.PI * 2);
                ctx.fill();
                partsRendered.push(bodyPart);
            });
        });
    }

    resetCenter() {
        this.sourceCenter = [
            this.canvas.width / 2,
            this.canvas.height / 2
        ];
    }

    setCenterToCurrentPosition() {
        this.sourceCenter = this.getPartPosition(this.bodyPart);
    }

    stop(){
        this._loop.stop();
    }

    _didRender(props: any, changed: any, prev: any) {
        if(changed && changed.hasOwnProperty('controls') && changed.controls) {
            setTimeout(()=> {
                const controls = this.shadowRoot.querySelector('acc-pose-input-calibration');
                if(controls && canFocusHeader(controls)) {
                    controls.focusHeader();
                }
            }, 16);

        }
        return super._didRender(props, changed, prev);
    }

    _render({ amplification, controls, help, imageScaleFactor, part, smoothing }:any){
        let isDark = false;
        //calculate if a dark background is set by computing the color and seeing if its average color is more than half way
        const computed = computeStyleResult(this.shadowRoot, 'color', backgroundColor);
        if(computed) {
            const color = cssColorToArray(computed);
            if(color) {
                isDark = ((color[0] + color[1] + color[2]) / 3) < 128;
            }
        }

        const postFix = isDark ? '-dark' : '';

        return html`
            <style>

            </style>
            <acc-pose-input-calibration
                closable
                tabIndex="0"
                on-center=${()=> this.setCenterToCurrentPosition()}
                on-resetcenter=${()=> this.resetCenter()}
                amplification="${amplification}"
                imageScaleFactor="${imageScaleFactor}"
                smoothing="${smoothing}"
                parts="${selectablePartsDisplay}"
                part="${keypointPartsMap[part]}"
                open?=${controls}
                fullscreen
                on-change=${(evt:any)=>{
                    const findPartId = () => {
                        for(let prop in keypointPartsMap) {
                            if(keypointPartsMap[prop] === evt.detail.part) {
                                return prop;
                            }
                        }
                    }
                    this.amplification = evt.detail.amplification;
                    this.bodyPart = findPartId(); //evt.detail.part;
                    this.imageScaleFactor = evt.detail.imageScaleFactor;
                    this.smoothing = evt.detail.smoothing;

                    this._dispatchChange();
                }}
                on-help=${()=> this.help = true}
                on-close=${()=>{ console.log("POSE INPUT CONTROLS ON CLOSE"); this.controls = false; }}
                on-close-click=${()=>this.controls = false}>
            </acc-pose-input-calibration>
            <acc-tutorial
                dark?=${isDark}
                closebutton="Back to settings"
                aria-live="polite"
                aria-atomic="true"
                on-close=${() => this.help = false}
                open?=${help}>
                <acc-slide
                    video="//storage.googleapis.com/acc-components/camera-tutorial-01${postFix}.mp4"
                    alt="Animation demonstrating moving your nose to control the cursor."
                    caption="Here's how to use your camera. A blue dot will follow the position of your nose."></acc-slide>
                <acc-slide
                    video="//storage.googleapis.com/acc-components/camera-tutorial-02${postFix}.mp4"
                    alt="Animation showing how to use the slider to amplify your cursors movement."
                    caption="Use the slider to help reach all parts of the screen. This works best if you're centered."></acc-slide>
                <acc-slide
                    video="//storage.googleapis.com/acc-components/camera-tutorial-03${postFix}.mp4"
                    alt="Animation demonstrating how the centerpoint works and how to move it."
                    caption="Or, you can move the centerpoint to you."></acc-slide>
                <acc-slide
                    video="//storage.googleapis.com/acc-components/camera-tutorial-04${postFix}.mp4"
                    alt="Animation of using the pop up button to select a different body part to track."
                    caption="You can also track different parts of your body, like your wrist or shoulder."></acc-slide>
            </acc-tutorial>
        `;
    }

    // _shouldRender(props: any, changed: any, prev: any) {
    //     if(changed && (changed.part || changed.amplification)) {
    //         return false;
    //     }
    //     return super._shouldRender(props, changed, prev);
    // }
}


customElements.define('acc-pose-input', PoseInputElement);
