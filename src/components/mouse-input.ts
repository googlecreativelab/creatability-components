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
import { clamp } from './../utils';
import { Animitter, InputType } from './types';
import { html } from '@polymer/lit-element';
import { scalemap } from '../utils';
import { property } from './decorators';
import { AbstractInputElement } from './abstract-input';
import { mousePositionFromEvent } from '../mouse-position';


const animitter = require('animitter');


enum MouseKeyboardInputMode {
    MOUSE,
    KEYBOARD,
    TOUCH
}


/**
 * A Mouse Input element binds mouse, keyboard and touch as a single method
 * of translating a cursor position.
 *
 * @see InputModeSelectElement
 */
class MouseInputElement extends AbstractInputElement {

    @property({ type: String })
    public label:string = 'Keyboard / Mouse';

    public inputType:InputType = 'mouse';
    private __mode: MouseKeyboardInputMode;
    public pressed:boolean = false;

    @property({ type: Number })
    public amplification:number = 1;

    @property({ type: Boolean })
    public enableKeyboard: boolean = false;

    @property({ type: Boolean})
    public disableTouchPreventsDefault: boolean = false;

    public get mode(): string {
        switch(this.__mode) {
            case MouseKeyboardInputMode.KEYBOARD:
                return 'keyboard';
            case MouseKeyboardInputMode.TOUCH:
                return 'touch';
            default:
                return 'mouse';
        }
    }

    protected _loop:Animitter = animitter();
    //used to determine if pressed is dirty and should be announced
    private __lastDispatchedPressed: boolean = false;

    constructor(){
        super();
        this._loop.on('update', this._dispatchTick);
        this._loop.on('start', ()=> console.log('loop started'));
    }


    @autobind
    private __handleKeyDown(event:KeyboardEvent) {
        if(!this.contentElement || !this.enableKeyboard) {
            return;
        }


        let contWidth = this.contentElement.clientWidth;
        let contHeight = this.contentElement.clientHeight;

        if(!contWidth || !contHeight) {
            const bcr = this.contentElement.getBoundingClientRect();
            contWidth = bcr.width;
            contHeight = bcr.height;
        }

        if(!contWidth || !contHeight) {
            return;
        }

        //times 2 because its from -1 to 1
        const mag = this.amplification / Math.min(contWidth, contHeight) * 2;
        this.pressed = false;

        if(!isFinite(this._lastFoundPosition[0] + this._lastFoundPosition[1])) {
            this._lastFoundPosition[0] = 0;
            this._lastFoundPosition[1] = 0;
        }


        let changed = false;

        switch(event.keyCode){

            case 37: //left
            this._lastFoundTargetPosition[0] -= this.amplification;
            this._lastFoundPosition[0] -= mag;
            changed = true;
            break;
            case 38: //up
            this._lastFoundTargetPosition[1] -= this.amplification;
            this._lastFoundPosition[1] -= mag;
            changed = true;
            break;
            case 39: //right
            this._lastFoundTargetPosition[0] += this.amplification;
            this._lastFoundPosition[0] += mag;
            changed = true;
            break;
            case 40: //down
            this._lastFoundTargetPosition[1] += this.amplification;
            this._lastFoundPosition[1] += mag;
            changed = true;
            break;
        }
        if(changed) {
            this.__mode = MouseKeyboardInputMode.KEYBOARD;
        }

        if(!this.disableClamp) {
            this._lastFoundTargetPosition[0] = clamp(this._lastFoundTargetPosition[0], 0, contWidth);
            this._lastFoundTargetPosition[1] = clamp(this._lastFoundTargetPosition[1], 0, contHeight);
        }

        // this._lastFoundPosition[0] = clamp(this._lastFoundPosition[0], -1, 1);
        // this._lastFoundPosition[1] = clamp(this._lastFoundPosition[1], -1, 1);
    }

    @autobind
    private _handleMouseMove(event:MouseEvent){

        const point = mousePositionFromEvent(event, this.contentElement);
        if (!this.disableTouchPreventsDefault && event.type.indexOf('mouse') === -1) {
            event.preventDefault();
        }

        //mouse
        this.pressed = event.buttons > 0;
        this.__mode = MouseKeyboardInputMode.MOUSE;

        //touch
        if(event.type.indexOf('touch') === 0) {
            this.__mode = MouseKeyboardInputMode.TOUCH;
            if (event.type === 'touchend') {
                this.pressed = false;
            } else {
                this.pressed = true;
            }
        }

        if (isFinite(point.x) && isFinite(point.y)) {
            const bcr = this.contentElement.getBoundingClientRect();
            const x = scalemap(point.x, 0, bcr.width, -1, 1);
            const y = scalemap(point.y, 0, bcr.height, -1, 1);

            this._lastFoundTargetPosition[0] = point.x;
            this._lastFoundTargetPosition[1] = point.y;

            this._lastFoundPosition[0] = x;
            this._lastFoundPosition[1] = y;
        }
    }

    async initialize(){
        if(this.isReady){
            return;
        }
        this._dispatchInitializing();
        return Promise.resolve()
            .then(()=>{
                this.__start();
                return this;
            });
    }

    _render({ controls }:any): any {
        return html`
            <acc-mouse-input-calibration
                tabIndex="0"
                on-close-click=${()=>this.removeAttribute('controls')}
                open?=${controls}>
            </acc-mouse-input-calibration>
        `;
    }

    protected _shouldDispatchInput() {
        const should = this.pressed !== this.__lastDispatchedPressed || super._shouldDispatchInput();
        this.__lastDispatchedPressed = this.pressed;
        return should;
    }

    private __start(){
        this.__addEvents();
        this._dispatchReady();
        this._loop.start();
    }

    protected _handleContentElementChanged(contentElement: HTMLElement, previous: HTMLElement) {
        this.__removeEvents(previous);
        this.__addEvents();
    }

    private __addEvents() {
        if(this.contentElement) {
            [
                'mousedown',
                'mousemove',
                'mouseup',
                'touchstart',
                'touchmove',
                'touchend'
            ].forEach((eventType) => this.contentElement.addEventListener(eventType, this._handleMouseMove));
            this.contentElement.addEventListener('keydown', this.__handleKeyDown);
        }
    }

    private __removeEvents(element: HTMLElement=this.contentElement) {
        if(element) {

            [
                'mousedown',
                'mousemove',
                'mouseup',
                'touchstart',
                'touchmove',
                'touchend'
            ].forEach((eventType) => element.removeEventListener(eventType, this._handleMouseMove));

            element.removeEventListener('keydown', this.__handleKeyDown);
        }
    }

    stop(){
        this.__removeEvents();
        this._loop.stop();
        this._dispatchStop();
    }
}

customElements.define('acc-mouse-input', MouseInputElement);
