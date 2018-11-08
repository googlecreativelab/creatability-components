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
import { accentColor, labelColor, backgroundColor } from './styles';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';
import { AbstractModalElement } from './abstract-modal';
import { setBooleanAttribute } from '../utils';



/**
 * An `<acc-snackbar>` element is floating element intended for temporary UI
 * notifications. Generally there is one instance per application. If you add
 * aria-live="polite" to the element in your HTML it will work as a
 * Live Region for Accessibility tools.
 *
 * @example ```html
 *
 * <acc-snackbar aria-live="polite" duration="5" dismissable>This will get read
 * out loud by screen readers whenever it changes</acc-snackbar>
 * ```
 */
export class SnackBarElement extends LitElement {

    /**
     * duration (in seconds) to stay visible after message changes,
     * if 0, stays visible indefinitely or until dismissed
     */
    @property({ type: Number })
    public duration:number = 4;

    /**
     * if true, shows a "DISMISS" button to close
     */
    @property({ type: Boolean })
    public dismissable: boolean = false;

    /**
     * if true, snackbar will be styled as an alert
     */
    @property({ type: Boolean })
    public error: boolean = false;

    private __lastMessageChange:number;
    private __previousFocus:HTMLElement;
    private __slot:HTMLElement;

    public get open() : boolean {
        return this.hasAttribute('open');
    }


    @autobind
    protected _handleSlotChange(){
        this.show();
    }


    _propertiesChanged(props:any, changed:any={}, prev:any={}){
        super._propertiesChanged(props, changed, prev);
        setBooleanAttribute(this, 'error', props.error);
        if(changed.message) {
            this.show();
        }
    }


    show(){
        const now = this.__lastMessageChange = Date.now();
        this.setAttribute('open', 'true');
        if (this.duration > 0 && !this.error) {
            setTimeout(()=>{
                //in case another message has been sent while it was open
                //dont close it until the last message has its duration
                if(this.__lastMessageChange === now){
                    this.hide();
                }
            }, this.duration * 1000);
        }

        if (this.error){
            const textElement = this.shadowRoot.querySelector('p') as HTMLElement
            setTimeout(() => {
                textElement.focus();
            }, 16);
        }
        this.dispatchEvent(new CustomEvent('show'));
    }

    hide(){
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('hide'));
        if (this.__previousFocus && this.error){
            this.__previousFocus.focus();
        }
        this.__previousFocus = null;
    }

    _didRender() {
        const currentFocus = document.activeElement as HTMLElement
        if (currentFocus !== this && currentFocus !== document.body &&
                currentFocus && !(currentFocus instanceof AbstractModalElement)){
            this.__previousFocus = currentFocus
        }

        if(this.__slot) {
            this.__slot.removeEventListener('slotchange', this._handleSlotChange);
        }
        const slot =this.shadowRoot.querySelector('slot');
        if(slot) {
            slot.addEventListener('slotchange', this._handleSlotChange);
            this.__slot = slot;
        }
    }

    _render({ duration, message }:any){
        return html`
            <style>
                :host([open]) {
                    display: block;
                    opacity: 1;
                }

                :host {
                    display: none;
                    box-shadow: 1px 1px rgba(0, 0, 0, 0.25);
                    position: fixed;
                    bottom: 40px;
                    left: 50%;
                    transform: translate(-50%, 0%);
                    background-color: ${backgroundColor};
                    border: 1px solid rgba(0,0,0,0.25);
                    color: ${labelColor};
                    min-width: 100px;
                    text-align: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 1s ease-in;
                }

                .container {
                    display: flex;
                    padding: 0 16px;
                }

                .container[error]{
                    border: 2px solid red;
                    background-color: rgba(255, 0, 0, 0.31);
                }

                strong {
                    color: ${accentColor};
                }

                .column {
                    display: inline-flex;
                    box-sizing: border-box;
                    padding: 0 8px;
                }

                .left {
                    max-width: 75%;
                }

                .right {
                    text-align: right;
                    margin-left: 50px;
                }

                .message {
                    min-width: 100%;
                    float: left;
                }

                .left .message {
                    min-width: 75%;
                    padding: 24px;
                }

                button {
                    font-size: 100%;
                    cursor: pointer;
                    float: left;
                    border: 0;
                    color: ${accentColor};
                    font-weight: bold;
                    background-color: transparent;
                }

            </style>
            <div class="container" error?=${this.error}>
                ${(this.dismissable) ?
                    html`
                        <div class="column left">
                            <p tabindex="0"><slot class="message" aria-atomic="true" aria-live="assertive" tabindex="0"></slot></p>
                        </div>
                        <div class="column right">
                            <button on-click=${()=> this.hide()}>DISMISS</button>
                        </div>
                    ` :
                    html`<p><slot class="message" aria-atomic="true" aria-live="assertive"></slot></p>`
                }
            </div>
        `;
    }
}


customElements.define('acc-snackbar', SnackBarElement);