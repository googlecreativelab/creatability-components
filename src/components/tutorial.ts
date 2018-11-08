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

import { html } from '@polymer/lit-element';
import { property } from './decorators';
import './slideshow';
import { AbstractModalElement } from './abstract-modal';

/**
 * A `<acc-tutorial>` element places a `<acc-slideshow>` into a fullscreen
 * modal container.
 */
export class Tutorial extends AbstractModalElement {

    @property({ type: String })
    public closeButton: string = 'Start Playing';

    constructor() {
        super();
        this.priority = 2
        this.exclusive = true
    }

    protected _handleCloseClick(){
        this.removeAttribute('open')
        this.dispatchEvent(new CustomEvent('close-clicked', { bubbles: true }));
    }

    focus(){
        super.focus()
        const header = this.shadowRoot.querySelector('h2') as HTMLElement
        if (header){
            header.focus()
        }
    }

    _renderModalBody({ closeButton }: any) {

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

                h2 {
                    height: 0px;
                    overflow: hidden;
                }

            </style>
            <div id="content">
                <h2 tabindex="-1">Tutorial</h2>
                <acc-slideshow closeButton="${closeButton}" on-close=${this._handleCloseClick.bind(this)}>
                    <slot></slot>
                </acc-slideshow>
            </div>
        `
    }
}

customElements.define('acc-tutorial', Tutorial);