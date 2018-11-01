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

import { accentColor, bodyFontFamily, labelColor, backgroundColor, buttonBackgroundColor } from './styles';
import { ContentElement } from './content';
import { ACCInputEvent } from '../events/input-event';
import { AbstractInputElement } from './abstract-input';
import { PoseInputElement } from './pose-input';
import { html } from '@polymer/lit-element';
import { AbstractModalElement } from './abstract-modal';
import { property } from './decorators';

import './range';

interface StyleMap {
    [index: string]: string;
}

const computeStyleResults = (parent: Element | ShadowRoot, map: StyleMap): StyleMap => {
    const result: StyleMap = {};
    //compute our accent color by applying it to a temp element
    const _tmpEl = document.createElement('div');
    _tmpEl.style.display = 'none';
    Object.assign(_tmpEl.style, map);
    parent.appendChild(_tmpEl);
    const computedStyle = window.getComputedStyle(_tmpEl);
    for (let key in map) {
        result[key] = (computedStyle as any)[key];
    }
    _tmpEl.parentElement && _tmpEl.parentElement.removeChild(_tmpEl);

    return result;
};


const options = (parts:string[], selectedPart:string)=>
    parts.map((part, i)=>
        html`<acc-item value="${part}" selected?=${part === selectedPart} label=${part}></option>`
    )

const hasHost = (v: any):v is { host: HTMLElement } =>
    v && typeof v.host !== 'undefined';

class PoseInputCalibrationElement extends AbstractModalElement {

    @property({ type: Number })
    public amplification:number = 1;

    @property({ type: Number })
    public smoothing:number = 0;

    @property({ type: String })
    public part:string;

    @property({ type: Array })
    public parts:string[] = [];

    @property({ type: Number })
    public imageScaleFactor:number = 0.5;

    @property({ type: String })
    public inputSelector: string = 'acc-pose-input';

    private __content: ContentElement;
    private __ctx: CanvasRenderingContext2D;
    //we will retrieve this using window.getComputedStyle(element)
    private __accentColor: string = 'white';
    private __centerColor: string = 'white';

    public inputElement: AbstractInputElement;


    constructor() {
        super();
        this._onTick = this._onTick.bind(this);
    }


    focusHeader() {
        const header = this.shadowRoot.querySelector('#header') as HTMLElement;
        if (header) {
            header.focus();
        }
    }

    _onTick(event: ACCInputEvent) {
        if (!this.__ctx || !this.__content) {
            return;
        }
        const { __ctx } = this;

        const input = (event.target as PoseInputElement);
        __ctx.canvas.width = this.__content.clientWidth;
        __ctx.canvas.height = this.__content.clientHeight;
        //__ctx.clearRect(0, 0, __ctx.canvas.width, __ctx.canvas.height);
        __ctx.lineWidth = 1;
        input.renderInputData(__ctx);
        input.renderCenter(__ctx, this.__centerColor);
        input.renderCursor(__ctx, this.__accentColor);
    }

    _propertiesChanged(props: any, changed: any, prev: any) {
        if(changed && typeof changed.open === 'boolean') {
            // let inputElement: PoseInputElement;
            // if (hasHost(this.parentNode)) {
            //     inputElement = this.parentNode.host as PoseInputElement;
            // }
            if (changed.open && this.inputElement) {
                // the pose input element
                this.inputElement.addEventListener('tick', this._onTick);
            } else if(this.inputElement) {
                this.inputElement.removeEventListener('tick', this._onTick);
            }
        }

        return super._propertiesChanged(props, changed, prev);
    }

    _firstRendered() {
        setTimeout(() => {
            //compute our accent color by applying it to a temp element
            const { backgroundColor, color } = computeStyleResults(this.shadowRoot, {
                backgroundColor: accentColor,
                color: labelColor
            });

            this.__accentColor = backgroundColor;
            this.__centerColor = color;
            this.inputElement = document.querySelector(this.inputSelector);
            if(this.inputElement && this.open){
                this.inputElement.addEventListener('tick', this._onTick);
            }
        }, 16);
        super._firstRendered();
    }

    _didRender(props: any, changed: any, prev: any) {
        const content = this.shadowRoot!.querySelector('acc-content') as ContentElement;
        if (content && hasHost(this.parentNode)) {
            this.__content = content;
            content.inputElement = this.parentNode.host as PoseInputElement;
        }
        const canvas = this.shadowRoot!.querySelector('#input-visualization')! as HTMLCanvasElement;
        if(changed && changed.amplification) {
            const range = this.shadowRoot.querySelector('acc-range') as HTMLElement;
            if(range) {
                range.focus();
            }
        }
        if(!canvas) {
            return;
        }
        this.__ctx = canvas.getContext('2d');
        return super._didRender(props, changed, prev);
    }

    _renderModalBody(props:any){

        const self:PoseInputCalibrationElement = this;

        const dispatch = (eventType: string= 'change', composed: boolean = false) =>{
            self.dispatchEvent(new CustomEvent(eventType, {
                    detail: {
                        target: self,
                        part: self.part,
                        amplification: self.amplification,
                        imageScaleFactor: self.imageScaleFactor,
                        smoothing: self.smoothing
                    },
                    composed,
                    bubbles: composed
                }
            ));
        }

        function onSelectInput(e:CustomEvent){
            //const selectedPart = self.parts[this.selectedIndex];
            const selectedPart = e.detail.value;
            //'this' scope is the select box
            if(this.id === 'part'){
                self.part = selectedPart;
            }

            console.log('self.part: ' + self.part);
            dispatch();
            //dispatch('center');
        }

        function onScaleInput(e:Event){
            self.imageScaleFactor = Number(this.value);
            dispatch();
        }

        function onSmoothing(e:Event) {
            self.smoothing = Number(this.value);
            dispatch();
        }

        function onAmplification(e:Event) {
            self.amplification = parseFloat(this.value);
            dispatch();

            const ampEl = self.shadowRoot.querySelector('.amp-value') as HTMLElement;
            if(ampEl) {
                ampEl.innerHTML = `${self.amplification.toFixed(1)}x`;
            }
        }

        return html`
            <style>


                @media ( max-height: 640px ) {
                    acc-content {
                        width: 320px;
                        height: 240px;
                    }
                }

                @media ( min-height: 641px ) and ( max-height: 760px ) {
                    acc-content {
                        width: 480px;
                        height: 360px;
                    }

                    #modal-body {
                    }
                }

                @media( min-height: 760px ) {
                    acc-content {
                        width: 640px;
                        height: 480px;
                    }
                }
                :host {
                    font-family: ${bodyFontFamily};
                }

                .container {
                    background-color: ${backgroundColor};
                    text-align: center;
                }


                acc-content {
                    background-color: white;
                    margin: 20px auto;
                }

                h2 {
                    font-family: ${bodyFontFamily};
                    color: ${labelColor};
                    display: inline-block;
                }

                h4 {
                    display: inline-block;
                }

                :host() * {
                }

                :host([debug]) .controls-row,
                :host([debug]) .controls-row-item,
                *[debug] .controls-row,
                *[debug] .controls-row-item {
                    border: 1px solid red;
                }

                .inner-container {
                    position: relative;
                    top: 50%;
                    width: auto;
                    transform: translate(0, -50%);
                }

                .controls-row {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    max-width: 960px;
                    margin: 0 auto;
                    padding: 8px;
                }

                .box {
                    box-sizing: border-box;
                    border: 1px solid black;
                }

                .controls-row-item {
                    align-self: baseline;
                    display: inline-flex;
                    order: 1;
                    flex-basis: auto;
                    flex-grow: 1;
                    flex-shrink: 1;
                    text-align: center;
                }


                a.reset-centerpoint {
                    font-family: ${bodyFontFamily};
                    color: ${accentColor};
                    text-decoration: none;
                    font-weight: 700;
                }

                .amp-value {
                    color: ${labelColor};
                    padding-left: 8px;
                    min-width: 24px;
                }

                .done {
                    --background-color: ${accentColor}:
                    --accent-color: ${backgroundColor};
                    width: 100px;
                }

                *[inline] .centerpoint-buttons {
                    display: flex;
                    flex-direction: row;
                    flex-shrink: 1;
                    flex-basis: auto;
                }

                .centerpoint-button {
                    padding: 0 8px;
                    display: inline-block;
                    width: auto;
                    --button-label-color: ${accentColor};

                    --button-border-width: 0;
                    font-weight: bold;
                    font-size: 14px;
                }
                label {
                    font-weight: bold;
                }

                .help-container {
                    cursor: pointer;
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    font-size: 18px;
                    color: ${accentColor};
                    font-weight: bold;
                    width: 80px;
                    text-align: right;
                    background: transparent;
                    border: 0;
                }

                .help-container svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .help-container span {
                    position: relative;
                    top: 50%;
                    transform: translate(0, -50%);
                }

                #help-question-mark {
                    fill: ${accentColor};
                }

                .control-pairing {
                    display: inline-flex;
                    flex-direction: row;
                    align-items: baseline;
                    margin: auto;
                }

                .control-pairing label {
                    flex-direction: row;
                    flex-basis: auto;
                }


                .centerpoint-buttons {
                    flex-direction: row;
                    flex-basis: auto;
                }

                .centerpoint-divider {
                    align-items: baseline;
                }

                #part {
                    margin: auto;
                }


                .close {
                    margin: 40px auto;
                    --button-background-color: ${accentColor};
                    --button-label-color: ${backgroundColor};
                    --button-border-color: ${accentColor};

                    text-align: right;
                    width: 150px;
                }

            </style>
            <div class="inner-container">
                <h2 id="header" tabindex="0">Body Tracking Settings</h2>
                <acc-content id="content-container" grayscale webcamopacity="0.5" disabled?=${!props.open}>
                    <canvas id="input-visualization" width="640" height="480">
                        Visualization of body tracking data.
                    </canvas>
                </acc-content>
                <div class="controls-row">
                    <div class="controls-row-item">
                        <acc-select label="Body Part:" id="part" on-change=${onSelectInput} inline>
                            ${options(this.parts, this.part)}
                        </acc-select>
                    </div>
                    <div class="controls-row-item">
                        <div class="control-pairing">
                            <acc-range
                                min="1"
                                max="6"
                                step="0.1"
                                label="Amplification:"
                                value="${this.amplification}"
                                on-input="${onAmplification}"
                                inline></acc-range>
                            <span class="amp-value">${this.amplification.toFixed(1)}x</span>
                        </div>
                    </div>
                    <div class="controls-row-item">
                        <div class="control-pairing">
                            <label style="font-size: 18px;">Centerpoint:</label>
                            <span class="centerpoint-buttons">
                                <acc-button
                                    class="centerpoint-button"
                                    label="Use current position"
                                    on-click=${()=> dispatch('center', true)}></acc-button>
                                    <span class="centerpoint-divider"> | </span>
                                <acc-button
                                    class="centerpoint-button"
                                    label="Reset"
                                    on-click=${()=> dispatch('resetcenter', true)}></acc-button>
                            </span>
                        </div>
                    </div>
                </div>
                <acc-button class="close" label="Done" on-click=${()=>this._handleCloseClick()}></acc-button>
            </div>
            <button class="help-container" role="button" on-click=${()=> dispatch('help')}>
                <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path id="help-question-mark" d="M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 L12,2 Z M13,19 L11,19 L11,17 L13,17 L13,19 L13,19 Z M15.07,11.25 L14.17,12.17 C13.45,12.9 13,13.5 13,15 L11,15 L11,14.5 C11,13.4 11.45,12.4 12.17,11.67 L13.41,10.41 C13.78,10.05 14,9.55 14,9 C14,7.9 13.1,7 12,7 C10.9,7 10,7.9 10,9 L8,9 C8,6.79 9.79,5 12,5 C14.21,5 16,6.79 16,9 C16,9.88 15.64,10.68 15.07,11.25 L15.07,11.25 Z" id="Shape" fill="#000000"></path>
                </svg>
                Help
            </button>
        `;
    }

    _shouldRender(props: any, changed: any, prev: any) {
        if(!changed){
            return super._shouldRender(props, changed, prev);
        }
        const keys = Object.keys(changed);
        const justAmp = (keys.length === 1 && changed.amplification);
        if(justAmp || (keys.length < 3 && changed.part && changed.amplification)) {
            return false;
        }

        return super._shouldRender(props, changed, prev);
    }

}

                    // <a
                    //     class="set-centerpoint"
                    //     href="javascript:;"
                    //     on-click=${()=> { dispatch('center'); return false; }}>Use current position</a> |
                    // <a
                    //     class="reset-centerpoint"
                    //     href="javascript:;"
                    //     on-click=${()=>{ dispatch('center'); return false;}}>Reset centerpoint</a>

customElements.define('acc-pose-input-calibration', PoseInputCalibrationElement);