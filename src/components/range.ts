import { labelStyleChunk } from './styles';
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
import { UIProperties } from './abstract-ui';
import { accentColor, labelColor } from './styles';
import { AbstractUIElement } from './abstract-ui';
import { html } from '@polymer/lit-element';
import { property } from './decorators';

const normalizeValue = (min:number, max:number, value:number) => {
    // console.log('calling normalize values for', name);
    let newMin = 0;
    let newMax = max - min;
    let newValue = value - min;

    newValue = (newValue*1.0/newMax);
    newMin = newMin/newMax;
    newMax = 1;

    return newValue;
};


export interface RangeProperties extends UIProperties {
    name: string;
    min: string;
    max: string;
    step: string;
    value: string;
}

/**
 * `<acc-range>` element is a custom range / slider component that simplifies
 * labelling.
 *
 * @example ```html
 *
 * <acc-range label="amplification" min="1" max="10" step="0.1" value="2"></acc-range>
 * ```
 */
class RangeElement extends AbstractUIElement {

    @property({ type: String })
    public name:string = '';

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
        let val = normalizeValue(parseFloat(this.min), parseFloat(this.max), sliderValue);

        const rangeEl = this.shadowRoot.querySelector('.range-slider__range')! as HTMLElement;

        rangeEl.style.backgroundImage = '-webkit-gradient(linear, left top, right top, '
                                        + `color-stop(${val}, ${accentColor}), `
                                        + 'color-stop(' + val + ', #D8D8D8)'
                                        + ')';
    }

    @autobind
    protected _handleShortcut() {
        const inputEl = this.shadowRoot.querySelector('.range-slider__range') as HTMLElement;
        if(inputEl) {
            inputEl.focus();
        }
        super._handleShortcut();
    }

    _render({ label, name, min, max, step, value }: RangeProperties){

        const [minf, maxf, valuef] = [min, max, value].map(parseFloat);

        const inputHtml = html`
            <input
                id="range-slider"
                class="range-slider__range"
                on-input=${(e:any) => this.changeGradient(e)}
                name="${name}"
                type="range"
                min="${min}"
                max="${max}"
                step="${step}"
                disabled?="${this.disabled}"
                aria-label="${name}"
                value="${value}"></input>
        `;

        return html`
            <style>

            ${labelStyleChunk()}

            :host([inline]), [inline] {
                display: inline-block;
            }

            :host([inline]) .range-slider label,
            :host([inline]) input[type="range"],
            *[inline] .range-slider label,
            *[inline] input[type="range"] {
                display: inline-block;
                max-width: 50%;
                vertical-align: middle;
            }

            :host([inline]) .range-slider label,
            *[inline] .range-slider label {
                padding: 0;
                padding-right: 4px;
                flex-shrink: 1;
                display: flex;
                align-self: flex-start;
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
                    color-stop(${value !== '' ? normalizeValue(minf, maxf, valuef) : 0.5}, ${accentColor}),
                    color-stop(${value !== '' ? normalizeValue(minf, maxf, valuef) : 0.5}, #D8D8D8)
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
                flex-shrink: auto;
            }

            [inline] #input-container {
                display: flex;
                flex-direction: row;
                flex-shrink: auto;
            }

            [inline] input[type="range"] {
                padding-right: 16px;
            }

            #input-container {
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
                <label for="range-slider">${label}</label>
                ${this.inlineLabel ? html`<span id="input-container">${inputHtml}</span>` : inputHtml}
            </div>
        `;

    }
}

customElements.define('acc-range', RangeElement);