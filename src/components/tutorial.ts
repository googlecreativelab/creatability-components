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

import { titleFontFamily, bodyFontFamily, outlineBorderColor, accentColor } from './styles'
import { LitElement, html } from '@polymer/lit-element';
import { property } from './decorators';
import './slideshow';
import { AbstractModalElement } from './abstract-modal';

export class Tutorial extends AbstractModalElement {

    constructor() {
        super();
        this.priority = 2
        this.exclusive = true
    }

    protected _handleCloseClick(){
        this.removeAttribute('open')
        this.dispatchEvent(new CustomEvent('close'));
    }

    focus(){
        super.focus()
        const container = this.shadowRoot.querySelector('.container') as HTMLElement
        if (container){
            container.focus()
        }
    }

    _renderModalBody() {

        return html`
            <style>

                :host([dark]), [dark] {
                    --background-color: black;
                    --button-fill: black;
                }

                :host {
                    --background-color: white;
                    --button-fill: white;
                }

                #content {
                    background-color: var(--background-color);
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    left: 0px;
                    top: 0px;
                }

                acc-slideshow {
                    height: 530px;
                    width: 700px;
                    max-width: 100%;
                    display: block;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
            </style>
            <div id="content">
                <acc-slideshow on-close=${this._handleCloseClick.bind(this)}>
                    <slot></slot>
                </acc-slideshow>
            </div>
        `
    }
}

customElements.define('acc-tutorial', Tutorial);