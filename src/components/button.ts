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
import { bodyFontFamily, buttonBackgroundColor, buttonLabelColor, iconSize, accentColor, buttonBorderColor, buttonFontSize, buttonFontWeight, buttonJustifyContent, buttonBorderWidth } from './styles';
import { html, LitElement } from '@polymer/lit-element';
import autobind from 'autobind-decorator';
import { property } from './decorators';
import { setBooleanAttribute } from '../utils';
import './icon'

export interface ButtonProperties extends UIProperties {
    icon: string;
}

/**
 * A `<acc-button>` element.
 * @example
 * ```html
 *
 *  <acc-button label="My Button" icon="my-icon.png"></acc-button>
 *  <acc-button label="My Button" disabled></acc-button>
 * ```
 */
export class ButtonElement extends AbstractUIElement {

    /**
     * a src URL for an icon to be shown inside the button
     */
    @property({ type: String })
    public icon: string = '';

    @autobind
    protected _handleShortcut() {
        this._dispatchClick()
        super._handleShortcut();
    }

    _dispatchClick() {
        this.dispatchEvent(new MouseEvent('click'));
    }


    focus(){
        super.focus();
        const button = this.shadowRoot.querySelector('button');
        if(button) {
            button.focus();
        }
    }

    _render({label, icon}: ButtonProperties){

        return html`
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 50px;
                    user-select: none;
                    cursor: pointer;
                    margin: 8px 0px;
                }


                :host([disabled]) {
                    pointer-events: none;
                    opacity: 0.5;
                }


                button {
                    position: relative;
                    font-size: ${buttonFontSize};
                    font-weight: ${buttonFontWeight};
                    font-family: ${bodyFontFamily};
                    width: 100%;
                    border: ${buttonBorderWidth} solid ${buttonBorderColor};
                    display: flex;
                    align-items: center;
                    justify-content: ${buttonJustifyContent};
                    text-transform: capitalize;
                    padding: 10px 0px;
                    background-color: ${buttonBackgroundColor};
                    color: ${buttonLabelColor};
                }

                button:hover {
                    cursor: pointer;
                }

                .icon {
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                }

                .label {
                    text-align: center;
                }

            </style>
            <button
                disabled?="${this.disabled}"
                tabindex="${this.disabled ? -1 : 0}"
                aria-label="${label}">
                <img class="icon" aria-hidden="true" src="${icon}" style="display: ${icon === '' ? 'none' : 'block'}"
                <span class="label">${label}</span>
            </button>


        `;
    }
}


customElements.define('acc-button', ButtonElement);