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

import { accentColor, labelColor, backgroundColor } from './styles';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';



export class SnackBarElement extends LitElement {

    //in seconds
    @property({ type: Number })
    public duration:number = 3;

    @property({ type: Boolean })
    public dismissable: boolean = false;

    @property({ type: Boolean })
    public error: boolean = false;

    //TODO it probably makes more sense for this to be innerHTML in slot
    @property({ type: String })
    public message:string = '';

    private __lastMessageChange:number;
    private __previousFocus:HTMLElement;

    public get open() : boolean {
        return this.hasAttribute('open');
    }

    connectedCallback(){
        super.connectedCallback()
        this.addEventListener('show', () => {
            if (this.error){
                const textElement = this.shadowRoot.querySelector('p') as HTMLElement
                setTimeout(() => {
                    textElement.focus();
                }, 10);
            }
        })
    }

    _propertiesChanged(props:any, changed:any={}, prev:any={}){
        super._propertiesChanged(props, changed, prev);
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
        const textElement:any = this.shadowRoot.querySelector('p');
        textElement.innerHTML = this.message;
        textElement.setAttribute('tabindex', '0');
        this.__previousFocus = document.activeElement as HTMLElement
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

                p {
                    min-width: 100%;
                    float: left;
                }
                
                .left p {
                    min-width: 75%;
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
            <div class="container" aria-atomic="true" aria-label="Overlay Message" error?=${this.error}>
                ${(this.dismissable) ?
                    html`
                        <div class="column left">
                            <p></p>
                        </div>
                        <div class="column right">
                            <button on-click=${()=> this.hide()}>DISMISS</button>
                        </div>
                    ` :
                    html`<p></p>`
                }
            </div>
        `;
    }
}


customElements.define('acc-snackbar', SnackBarElement);