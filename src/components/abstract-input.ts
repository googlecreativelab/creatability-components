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

import { add, copy, scale, sub, distance, equal } from './../vec2';
import { scalemap } from './../utils';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';
import { InputType } from './types';



export interface InputProperties {
    selected?:boolean;
    initialized?:boolean;
    controls?:boolean;
    contentSelector?: string;
}

/**
 * any event coming from an AbstractInputElement should include
 * these properties in its details
 */
export interface InputEventDetails {
    inputType:InputType;
    target:AbstractInputElement;
    position:[number, number];
}

export interface ErrorEventDetails {
    message: string;
}

/**
 * extend CustomEventInit to make details a required property
 */
type InputEventInit = CustomEventInit<InputEventDetails>;




/**
 * Every event coming from an AbstractInputElement
 */
export class ACCInputEvent extends CustomEvent<InputEventDetails> {
    /**
     * Dispatched when an inputs properties have changed
     * @event
     */
    public static CHANGE: string = 'change';
    /**
     * Dispatched when the input is beginning to initialize and load itself
     * @event
     */
    public static INITIALIZING: string = 'initializing';
    /**
     * Dispatched when the input has completed initializing itself
     * @event
     */
    public static READY: string = 'ready';
    /**
     * Dispatched every time theres an update, this is 60fps for webcams
     * @event
     */
    public static TICK: string = 'tick';
    /**
     * Dispatches every time there is a new value from the input
     * @event
     */
    public static INPUT: string = 'input';
    /**
     * Dispatched when the input has been stopped
     * @event
     */
    public static STOP: string = 'stop';

    constructor(type:string, eventInitDict:InputEventInit){
        super(type, eventInitDict);
    }
}

export class ACCErrorEvent extends CustomEvent<ErrorEventDetails> {

    /**
     * Dispatched whenever there is an error
     * @event
     */
    public static ERROR: string = 'error';

    constructor(error: Error) {
        super(ACCErrorEvent.ERROR, {
            detail: {
                message: error.message
            }
        });
    }
}



export const isAbstractInputElement = (el:any): el is AbstractInputElement =>
    ['selected', 'initialized', 'controls'].every(prop=> typeof el[prop] !== 'undefined');

/**
 * AbstractInputElement is the base abstract class for all inputs
 */
export abstract class AbstractInputElement extends LitElement {

    ///////////////////////////////
    // Properties

    /**
     * setting this property or attribute will display the input's calibration
     */
    @property({ type:Boolean })
    public controls:boolean = false;

    /**
     * a higher smoothing value (0-1) results in a slower and smoother
     * interpolation towards the current position. This creates less jitter
     * from an input but a high value can make the input feel slow.
     */
    @property({ type: Number })
    public smoothing:number = 0;

    /**
     * this attribute is used on the HTML node to denote it is the selected input
     * and to begin initializing
     */
    @property({ type:Boolean })
    public selected:boolean = false;


    @property({ type: String })
    public contentSelector:string = '';

    @property({ type: Boolean })
    public disableClamp: boolean = false;


    ///////////////////////////////////


    public get hasControls() {
        return false;
    }


    /**
     * the type of input this instance is, i.e. 'mouse', 'pose'
     */
    public inputType:InputType;

    /**
     * the main element of content, set through 'target' or 'targetSelector'
     */
    private __contentEl: HTMLElement;

    public targetPosition:[number, number] = [0, 0];
    protected _lastFoundTargetPosition:[number, number] = [0, 0];

    /**
     * the input's vector that is updated whenever there is new input data
     */
    public position:[number, number] = [-1, -1];

    /**
     * the input's current target vector, this could be different if smoothing
     * is more than 0
     */
    protected _lastFoundPosition:[number, number] = [-1, -1];


    private __isInitializing:boolean = false;
    private __isReady:boolean = false;
    private __hasTickedSinceReady:boolean = false;
    protected _wasAborted:boolean = false;

    /**
     * is the input currently in the phase of initializing itself?
     */
    public get isInitializing(){
        return this.__isInitializing;
    }

    /**
     * has the input completed initialization and is currently in operation?
     */
    public get isReady(){
        return this.__isReady;
    }


    public set contentElement(element: HTMLElement | null) {
        const changed = this.__contentEl !== element;
        const prev = this.__contentEl;
        this.__contentEl = element;

        //provide a hook
        if(changed) {
            this._contentElementChanged(element, prev);
        }
    }

    public get contentElement(): HTMLElement | null {
        if (!this.__contentEl && this.contentSelector) {
            this.contentElement = document.querySelector(this.contentSelector);
        }
        return this.__contentEl;
    }


    constructor(){
        super();
        [
            '_dispatchInitializing',
            '_dispatchReady',
            '_dispatchStop',
            '_dispatchTick'
        ].forEach(fnStr=> (<any>this)[fnStr] = (<any>this)[fnStr].bind(this));
    }

    /**
     * the Event that will be provided in every dispatched event from an input
     * Most input's will override this to provide even more data unique to their input
     * @param type
     * @param bubbles
     * @param composed
     */
    protected _createEvent(type:string, bubbles:boolean=true, composed:boolean=true): ACCInputEvent {
        const eventInit:InputEventInit = {
            detail: {
                inputType: this.inputType,
                target: this,
                position: this.position
            },
            bubbles,
            //send outside of shadow to parent element
            composed
        };

        return new ACCInputEvent(type, eventInit);
    }


    /**
     * Must be called to begin using input mode, listen to 'ready' to know when completed
     */
    abstract initialize():void;

    abstract stop():void

    /**
     * apply smoothing to the current position,
     * moving towards the _targetPosition according to smoothing
     * @returns true if the position value changed
     */
    protected _stepTowardsTarget(): boolean {
        const pos = this.position;
        const last = this._lastFoundPosition;
        const targPos = this.targetPosition;
        const lastTarg = this._lastFoundTargetPosition;
        const { smoothing } = this;

        if ( equal(pos, last) ) {
            return false;
        }

        //if theres no smoothing
        //or this is the first tick since ready
        //or its really really close, set to target
        if(smoothing === 0 || !this.__hasTickedSinceReady || distance(pos, last) < 0.00001){
            copy(last, pos);
            copy(lastTarg, targPos);
        } else {
            const ease = scalemap(smoothing, 0, 1, 0.95, 0);

            this.position = add(pos, scale(sub(last, pos), ease));
            this.targetPosition = add(targPos, scale(sub(lastTarg, targPos), ease));
        }
        return true;
    }

    /**
     * should an 'input' event be dispatched as well on this tick
     * this method exists so you can override in other inputs to consider other variables
     */
    protected _shouldDispatchInput() :boolean {
        return this._stepTowardsTarget();
    }


    /**
     * is it ok to initialize this input?
     * no if it is already initializing or it was aborted mid-initialization
     */
    public get canInitialize(): boolean {
        //TODO should also if fail if input cant be supported, like if wasm isnt supported
        return !this._wasAborted && !this.__isInitializing;
    }


    //overriding to ensure consistent event types
    dispatchEvent(evt:ACCInputEvent){
        return super.dispatchEvent(evt);
    }

    protected _dispatchChange(): void {
        this.dispatchEvent(this._createEvent(ACCInputEvent.CHANGE));
    }

    /**
     * when the input BEGINS to load any required resources, ask for any permissions etc
     * @event
     */
    protected _dispatchInitializing():void {
        this.__isInitializing = true;
        this.dispatchEvent(this._createEvent(ACCInputEvent.INITIALIZING));
    }

    /**
     * when the input has successfully began
     * @event
     */
    protected _dispatchReady():void {
        this.__isInitializing = false;
        this.__isReady = true;
        this.__hasTickedSinceReady = false;
        this.dispatchEvent(this._createEvent(ACCInputEvent.READY));
    }

    /**
     * when the input has performed any new effort,
     * even if there is no new input found.
     * i.e. webcam updated but no face was found, this still triggers
     * @event AbstractInputElement#tick dispatched every time the input updates, even if no changes
     */
    protected _dispatchTick():void {
        if (this._shouldDispatchInput()) {
            // the position value changed
            this.__dispatchInput();
        }
        /**
         * Tick event, occurs on every update
         * @event AbstractInput#tick
         */
        this.dispatchEvent(this._createEvent('tick'));
        this.__hasTickedSinceReady = true;
    }

    protected _dispatchError(error: Error):void {
        //TODO should be a better error event than this
        super.dispatchEvent(
            new CustomEvent('error', {
                detail: {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                },
                bubbles: true,
                composed: true
            })
        );
    }

    /**
     * when the input has stopped operation
     */
    protected _dispatchStop():void {
        if(this.__isInitializing){
            this._wasAborted = true;
        }
        //TODO should this be set false here or inside each inputs initializing where it completes or fails?
        this.__isInitializing = false;
        this.__isReady = false;
        this.dispatchEvent(this._createEvent('stop'))
    }

    /**
     * when the input has new tracking data to announce
     */
    private __dispatchInput():void {
        this.dispatchEvent(this._createEvent('input'));
    }

    public _propertiesChanged(props: InputProperties, changedProps: InputProperties, prevProps: InputProperties): void {
        super._propertiesChanged(props, changedProps, prevProps);

        if(!changedProps || !prevProps){
            //this can happen as a result from changing an attribute directly
            return;
        }
        if (changedProps.contentSelector) {
            this.contentElement = null;
            // query the new selector to get the element
            this.contentElement;
            //if the document isn't ready yet the selector element might not yet be in dom
            if (document.readyState !== 'complete') {
                const waitUntilReady = () => {
                    this.contentElement;

                    if(this.contentElement || document.readyState === 'complete') {
                        document.removeEventListener('readystatechange', waitUntilReady);
                    }
                };
                document.addEventListener('readystatechange', waitUntilReady);
            }
        }
        //update controls as attribute because CSS
        if(changedProps.controls && !prevProps.controls){
            this.setAttribute('controls', 'true');
            this.dispatchEvent(this._createEvent('controlsopen'));
        } else if(!changedProps.controls && prevProps.controls) {
            this.removeAttribute('controls');
            this.dispatchEvent(this._createEvent('controlsclose'));
        }

        if(!changedProps.selected && prevProps.selected){
            this.stop();
        } else if(changedProps.selected && !prevProps.selected){
            this.initialize();
        }

    }

    protected _contentElementChanged(contentElement: HTMLElement, previous: HTMLElement) {

    }

    _render(_props:any){
        return html``;
    }

    setTargetPosition([x, y]: [number, number]) {
        this._lastFoundTargetPosition[0] = x;
        this._lastFoundTargetPosition[1] = y;

        const bcr = this.contentElement.getBoundingClientRect();
        const nx = scalemap(x, 0, bcr.width, -1, 1);
        const ny = scalemap(y, 0, bcr.height, -1, 1);
        this._lastFoundPosition[0] = nx;
        this._lastFoundPosition[1] = ny;
        this._dispatchTick();
    }

    setPosition([x, y]: [number, number]) {
        this._lastFoundPosition[0] = x;
        this._lastFoundPosition[1] = y;

        const bcr = this.contentElement.getBoundingClientRect()
        const sx = scalemap(x, -1, 1, 0, bcr.width);
        const sy = scalemap(y, -1, 1, 0, bcr.height);
        this._lastFoundTargetPosition[0] = sx;
        this._lastFoundTargetPosition[1] = sy;
        this._dispatchTick();
    }

    _shouldPropertyChange(property:string, value:any, old:any) {
        if(property === 'smoothing'){
            //constrain smoothing to 0>= value <= 1
            const v = value as number;
            if( v < 0 || v > 1){
                return false;
            }
        }
        return super._shouldPropertyChange(property, value, old);
    }
}