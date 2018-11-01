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

import { fillColor } from './styles';
import { html, LitElement } from '@polymer/lit-element';


const icons:any = {
    // Hamburger
    menu: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>`,

    // X icon
    close: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
        </svg>`,

    // Downward arrow, like for select
    down : `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
        </svg>`,

    // External Link Icon - square with an arrow
    link : `
        <svg width="14px" height="14px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <polygon points="0 0 0 20 20 20 20 12 18 12 18 18 2 18 2 2 8 2 8 0"></polygon>
            <polygon points="11.707 0 11.707 2 17.293 2 8 11.293 9.414 12.707 18.707 3.414 18.707 9 20.707 9 20.707 0"></polygon>
        </svg>`,

    // Next Arrow, like for a tutorial
    next : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"/><path fill="none" d="M0 0h24v24H0z"/></svg>`,

    // Previous Arrow, like for a tutorial
    previous : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z"/><path fill="none" d="M0 0h24v24H0z"/></svg>`
};

class IconElement extends LitElement {

    static get properties(){
        return {
            icon:String
        };
    }

    public icon:string = '';
    private _iconElement:HTMLElement;

    constructor(){
        super()
        this._iconElement = document.createElement('i')
    }

    // _propertiesChanged(props:any){

        /*console.log(props.icon)
        if (icons[props.icon]){
            this._iconElement.innerHTML = icons[props.icon]
            this.setAttribute('aria-label', props.icon)
            // this.requestRender()
        }*/
    // }

    _render(){
        if (icons[this.icon]){
            this._iconElement.innerHTML = icons[this.icon]
            this.setAttribute('aria-label', this.icon)
        }
        return html`
            <style>
                svg {
                    margin: auto;
                    display: block;
                }

                svg {
                    fill: ${fillColor};
                }
            </style>
            ${this._iconElement}
        `
    }
}

customElements.define('acc-icon', IconElement);