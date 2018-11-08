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

import { AbstractUIElement, UIProperties } from './abstract-ui';
import { bodyFontFamily, labelColor, accentColor, accentOffColor } from './styles';
import { html } from '@polymer/lit-element';
import { property } from './decorators';
import { setBooleanAttribute } from '../utils';
import autobind from 'autobind-decorator';


export interface ToggleProperties extends UIProperties {
    checked: boolean;
}


/**
 * An `<acc-toggle>` element is similar to a checkbox. It is a button where its
 * `checked` value toggles each time clicked. This element handles labeling
 * (including checked state information) as well as additional ARIA attributes.
 *
 * @example ```html
 *
 * <acc-toggle label="Pen Down" checked></acc-toggle>
 * ```
 */
export class ToggleElement extends AbstractUIElement {

    @property({ type: Boolean })
    public checked:boolean = false;


    public get value() :string {
        return String(this.checked);
    }


    focus(){
        super.focus()
        this.shadowRoot.querySelector('button').focus()
    }

    @autobind
    protected _handleShortcut() {
        this.checked = !this.checked;
        super._handleShortcut();
    }

    _render({ label, shortcut, checked }: ToggleProperties){
        const value = this.value;
        let title = `${label}, toggled ${checked ? 'on' : 'off'} `;
        if (!!shortcut) {
            title += ` (${shortcut})`;
        }

        return html`
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 50px;
                    user-select: none;
                    cursor: pointer;
                    color: ${labelColor};
                }

                button {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    text-align: left;
                    cursor: pointer;
                }

                .indicator {
                    position: absolute;
                    top: 50%;
                    right: 20px;
                    transform: translate(0, -50%);
                    width: 32px;
                }

                :host([disabled]) {
                    pointer-events: none;
                    opacity: 0.25;
                }

                .title {
                    color: ${labelColor};
                    font-family: ${bodyFontFamily};
                    font-size: 18px;
                }

                :host([checked]) .indicator {
                    border: none;
                    opacity: 1;
                }

                .accent {
                    transition: fill 3s linear;
                }
                #on-indicator .accent {
                    fill: ${accentColor};
                }

                #off-indicator .accent {
                    fill: ${accentOffColor};
                }


            </style>
                <button role="checkbox" aria-checked$="${this.checked}" disabled?="${this.disabled}" title="${title}" on-click=${()=> this.checked = !this.checked}>
                <span class="title">${label||value}</span>
                <div class="indicator">
                    <svg id="off-indicator" style$="display: ${this.checked ? 'none' : 'block'}"
                        width="49px" height="28px" viewBox="0 0 49 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <title>Currently toggled off</title>
                        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <path class="accent" d="M38.3152174,21.25 L12.7717391,21.25 C7.79076087,21.25 3.83152174,17.375 3.83152174,12.5 C3.83152174,7.625 7.79076087,3.75 12.7717391,3.75 L38.3152174,3.75 C43.2961957,3.75 47.2554348,7.625 47.2554348,12.5 C47.2554348,17.375 43.2961957,21.25 38.3152174,21.25 Z" id="track" fill-opacity="0.26" fill="#221F1F"></path>
                            <ellipse class="accent" cx="12.7717391" cy="12.5" rx="12.5217391" ry="12.25"></ellipse>
                        </g>
                    </svg>

                    <svg id="on-indicator" style$="display: ${this.checked ? 'block' : 'none'}"
                        width="47px" height="27px" viewBox="0 0 47 27" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <title>Currently toggled on</title>
                        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <path class="accent" d="M42.2702703,12.5 C42.2702703,17.375 38.4162162,21.25 33.5675676,21.25 L8.7027027,21.25 C3.85405405,21.25 0,17.375 0,12.5 L0,12.5 C0,7.625 3.85405405,3.75 8.7027027,3.75 L33.5675676,3.75 C38.4162162,3.75 42.2702703,7.625 42.2702703,12.5 L42.2702703,12.5 L42.2702703,12.5 Z" id="track" fill="#0054FF" opacity="0.5"></path>
                            <ellipse class="accent" cx="33.5675676" cy="12.5" rx="12.1824324" ry="12.25"></ellipse>
                        </g>
                    </svg>
                </div>
            </button>
        `;
    }


    _propertiesChanged(props:any, changedProps:any, prevProps:any){
        if(!changedProps || !prevProps){
            return;
        }

        let changed = false;

        if(changedProps.checked !== prevProps.checked){
            setBooleanAttribute(this, 'checked', props.checked);
            changed = true;
        }

        if (changedProps.disabled !== prevProps.disabled) {
            changed = true;
        }

        if (changed) {
            const customEvent = {
                detail: {
                    target: this,
                    checked: this.checked
                }
            };

            this.dispatchEvent(new CustomEvent('change', customEvent));
        }

        super._propertiesChanged(props, changedProps, prevProps);
    }

    _shouldPropertyChange(property: string, value: any, old: any) {
        //prevent checked value from changing if its disabled
        if(property === 'checked' && this.disabled) {
            return false;
        }
        return super._shouldPropertyChange(property, value, old);
    }

}


customElements.define('acc-toggle', ToggleElement);