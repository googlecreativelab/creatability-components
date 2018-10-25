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

import { KeyboardShortcutObserver } from './../keyboard-shortcut-observer';
import { bodyFontFamily, buttonBackgroundColor, buttonLabelColor, iconSize, accentColor, buttonBorderColor, buttonFontSize, buttonFontWeight, buttonJustifyContent, buttonBorderWidth } from './styles';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';
import { setBooleanAttribute } from '../utils';
import './icon'

export interface ButtonElementProperties {
    label:string;
    icon: string;
}

export class ButtonElement extends LitElement {
    @property({ type: String })
    public icon: string = '';

    @property({ type: String })
    public label:string = '';

    @property({ type: Boolean })
    public disabled: boolean = false;

    @property({ type: String })
    public shortcut: string = '';

    private __shortcutObserver: KeyboardShortcutObserver;

    connectedCallback() {
        super.connectedCallback();
        this.__shortcutObserver = new KeyboardShortcutObserver(this.shortcut, ()=> {
            this.dispatchEvent(new CustomEvent('shortcut', {bubbles : true, composed : true}))
            this._dispatchClick()
        });
    }

    disconnectedCallback() {
        this.__shortcutObserver.disconnect();
        super.disconnectedCallback();
    }

    _dispatchClick() {
        this.dispatchEvent(new MouseEvent('click'));
    }

    _propertiesChanged(props: any, changed: any, prev: any) {
        if(!changed) {
            return;
        }

        if(typeof changed.shortcut !== 'undefined' && this.__shortcutObserver) {
            this.__shortcutObserver.pattern = props.shortcut;
        }

        if(typeof changed.disabled !== 'undefined') {
            setBooleanAttribute(this, 'disabled', props.disabled);
        }
        super._propertiesChanged(props, changed, prev);
    }

    focus(){
        super.focus();
        const button = this.shadowRoot.querySelector('button');
        if(button) {
            button.focus();
        }
    }

    _render({label, icon}:ButtonElementProperties){

        let iconName = ''
        if (this.label.toLowerCase() === 'play'){
            iconName = 'play'
        } else if (this.label.toLowerCase() === 'stop'){
            iconName = 'stop'
        } else if ((/(restart|clear)/gi).test(this.label)) {
            iconName = 'replay'
        }

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

//<acc-icon icon="${iconName}" style$="display: ${ iconName !== '' ? 'block' : 'none'}" aria-hidden="true"></acc-icon>

customElements.define('acc-button', ButtonElement);