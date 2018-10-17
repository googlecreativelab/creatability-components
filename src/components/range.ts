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

import { accentColor, labelColor } from './styles';

import { html, LitElement } from '@polymer/lit-element';
import { AbstractModalElement } from './abstract-modal';
import { scalemap } from '../utils';
import { property } from './decorators';
import { getLabelTemplate } from "./label";

const normalizeValue = (name:string, min:number, max:number, value:number) => {
    // console.log('calling normalize values for', name);
    let newMin = 0;
    let newMax = max - min;
    let newValue = value - min;

    newValue = (newValue*1.0/newMax);
    newMin = newMin/newMax;
    newMax = 1;

    return newValue;
};


class RangeElement extends LitElement {

    @property({ type: String })
    public name:string = '';

    @property({ type: String })
    public label:string = '';

    @property({ type: String })
    public min:string = '0';

    @property({ type: String })
    public max:string = '100';

    @property({ type: String })
    public step:string = '1';

    @property({ type: String })
    public value:string = '';

    @property({ type: Boolean })
    public inlineLabel:boolean = false;

    @property({ type: Boolean })
    public disabled:boolean = false;

    protected labelHtml:any;


    constructor(){
        super();
        this.labelHtml = html`0`;
    }

    changeGradient(e:any) {
        this.value = e.currentTarget.value;
        this.dispatchEvent(new CustomEvent(e.type, {
            bubbles: true,
            detail: {
                inputEvent: e
            }
        }));

        // Normalize Values
        let sliderValue = parseFloat(e.currentTarget.value);
        let val = normalizeValue(this.name, parseFloat(this.min), parseFloat(this.max), sliderValue);

        const rangeEl = this.shadowRoot.querySelector('.range-slider__range')! as HTMLElement;

        rangeEl.style.backgroundImage = '-webkit-gradient(linear, left top, right top, '
                                        + `color-stop(${val}, ${accentColor}), `
                                        + 'color-stop(' + val + ', #D8D8D8)'
                                        + ')';
    }

    _propertiesChanged(props:any, changed:any, prev:any){
        if(!changed){
            return;
        }
        if (changed && changed.label) {
            this.labelHtml = getLabelTemplate(changed.label, this.id);
            this.requestRender();
        }
        super._propertiesChanged(props, changed, prev);
    }

    _render({
        id,
        name,
        min,
        max,
        step,
        value
    }:any){

        const inputHtml = html`
            <input class="range-slider__range"
               on-input=${(e:any) => this.changeGradient(e)}
               id="${this.id}"
               name="${name}"
               type="range"
               min="${min}"
               max="${max}"
               step="${step}"
               disabled?="${this.disabled}"
               aria-label="${name}"
               value="${value}"></input>
        `

        return html`
            <style>

            :host([inline]) {
                display: inline-block;
            }

            :host([inline]) .range-slider label,
            :host([inline]) input[type="range"] {
                display: inline-block;
                max-width: 50%;
                vertical-align: middle;
            }

            :host([inline]) .range-slider label {
                float: none;
                padding: 0;
            }
            input[type="range"]{
                -webkit-appearance: none;
                -moz-apperance: none;
                height: 19px;
                width: 100%;
                display: block;
                border-top: 8px solid var(--background-color, white);
                border-bottom: 8px solid var(--background-color, white);
                box-sizing: border-box;
                background-image: -webkit-gradient(
                    linear,
                    left top,
                    right top,
                    color-stop(${value !== '' ? normalizeValue(name, min,max,value) : 0.5}, ${accentColor}),
                    color-stop(${value !== '' ? normalizeValue(name, min,max,value) : 0.5}, #D8D8D8)
                );
                margin: 0px;
            }



            input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none !important;
                background-color: ${accentColor};
                height: 18px;
                width: 18px;
                border-radius: 50%;
            }

            input[type='range']::-moz-range-thumb {
                -webkit-appearance: none !important;
                background-color: ${accentColor};
                height: 18px;
                width: 18px;
                border-radius: 50%;
                border: none;
            }

            input[type='range']::-moz-range-track  {
                width: 100%;
                height: 0px;
            }

            .range-slider label {
                float: left;
                display: ${this.inlineLabel ? "inline-block" : "block"};
                color: ${labelColor};
            }


            span {
                position: relative;
                height: 30px;
                display: block;
                overflow: hidden;
                padding-right: 5px;
                padding-top: 1px;
                padding-left: 14px;
            }

            .range-slider__range[disabled] {
                pointer-events: none;
                opacity: 0.5;
            }
            </style>

            <div class="range-slider">
                ${this.labelHtml}
                ${this.inlineLabel ? html`<span>${inputHtml}</span>` : inputHtml}
            </div>
        `;

    }
}

customElements.define('acc-range', RangeElement);