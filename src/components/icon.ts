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
    pause : require('raw-loader!../assets/icons/pause.svg'),
    play : require('raw-loader!../assets/icons/play.svg'),
    stop : require('raw-loader!../assets/icons/stop.svg'),
    menu : require('raw-loader!../assets/icons/menu.svg'),
    close : require('raw-loader!../assets/icons/close.svg'),
    replay : require('raw-loader!../assets/icons/replay.svg'),
    code : require('raw-loader!../assets/icons/code.svg'),
    down : require('raw-loader!../assets/icons/down.svg'),
    link : require('raw-loader!../assets/icons/link.svg'),
    next : require('raw-loader!../assets/icons/next.svg'),
    previous : require('raw-loader!../assets/icons/previous.svg'),
    'volume-on' : require('raw-loader!../assets/icons/volume-on.svg'),
    'volume-off' : require('raw-loader!../assets/icons/volume-off.svg'),
    'chrome' : require('raw-loader!../assets/icons/chrome_experiment.svg'),
    'badges' : require('raw-loader!../assets/icons/badges.svg'),
}

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