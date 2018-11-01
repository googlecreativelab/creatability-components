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

import { backgroundColor, bodyFontFamily, labelColor } from './styles';
import { isAbstractInputElement, AbstractInputElement } from './abstract-input';
import { html } from '@polymer/lit-element';
import { SelectableElement, AbstractSelectLitElement } from './abstract-select';
import { isElement } from '../utils';
import { property } from './decorators';
import {getLabelTemplate} from "./label";


interface InputModeElement extends SelectableElement {
    contentSelector: string;
    contentElement: HTMLElement | null;
    hasControls: boolean;
    inputType: string;
    initialize: Function;
    controls: boolean;
    label: string;
}

interface UIElements {
    label:string;
}

/**
 * <acc-input-mode-select>
 * Creates a UI element for selecting an appropriate input method,
 * bundles proper initialization, event bubbling, access to calibration
 * and messaging.
 * @extends AbstractSelectLitElement
 */
export class InputModeSelectElement extends AbstractSelectLitElement {

    /**
     * provide a selector for the content element the input is applied to
     */
    @property({ type: String })
    public contentSelector:string = 'body'; //'acc-content';


    @property({ type: String})
    public label:string = '';

    constructor() {
        super();
        this._nodeChildSelector = '*';
    }

    // focus() {
    //     super.focus();
    //     const select = this.shadowRoot.querySelector('select');
    //     if(select) {
    //         select.focus();
    //     }
    // }


    set contentElement(element: HTMLElement | null) {
        this.items.forEach(item => {
            item.contentElement = element;
        });
    }

    get contentElement(): HTMLElement | null {
        return this.selected && this.selected.contentElement;
    }

    get items(): InputModeElement[] {
        return this._nodes as InputModeElement[];
    }

    get selected(): InputModeElement {
        return super.selected as InputModeElement;
    }

    get value():string {
        return this.selected ? (<any>this.selected).inputType : undefined;
    }

    select(node:InputModeElement){
        super.select(node);
    }

    showCameraSettings() {
        this._handleOptionsClicked(true);
    }

    _propertiesChanged(props:any, changedProps:any, prevProps:any) {
        super._propertiesChanged(props, changedProps, prevProps);
        if(changedProps && changedProps.contentSelector){
            this.items.forEach((item =>{
                item.contentSelector = props.target;
            }));
        }
    }

    protected _handleOptionsClicked(showExternally:boolean = false){
        this.selected.controls = !this.selected.controls;

        if (this.selected.controls) {
            const onControlsClose = () => {
                this.selected.removeEventListener('controlsclose', onControlsClose);
                //set focus back to settings button
                const settingsButton = this.shadowRoot!.querySelector('.settings') as HTMLElement;
                if (settingsButton && !showExternally) {
                    settingsButton.focus();
                }
            }

            this.selected.addEventListener('controlsclose', onControlsClose);

        }
    }

    _addNode(node:InputModeElement){
        if(this.contentElement) {
            node.contentElement = this.contentElement;
        } else {
            node.contentSelector = this.contentSelector;
        }
        super._addNode(node);
    }

    _render({label}:UIElements){
        const sI = this.selectedIndex;
        const hasControls = this.selected && this.selected.hasControls;

        const self = this;
        function onSelectInput(e:Event){
            //'this' scope is the select box
            self.select(self.items[this.selectedIndex]);
        }

        return html`
        <style>
            :host select, button {
                font-size: 18px;
            }

            select {
                width:100%;
                height: 30px;
                cursor: pointer;
                display: inline-block;
                position: relative;
                font-size: 18px;
                font-family: ${bodyFontFamily};
                text-transform: capitalize;
                background-color: ${backgroundColor};
                color: ${labelColor};
                -moz-appearance:none; /* Firefox */
                -webkit-appearance:none; /* Safari and Chrome */
                appearance:none;
                border: 0;

            }

            .select-style {
                position: relative;
                padding: 0 0px 20px 0px;
                margin: 0;
                border: none;
                width: 100%;
                overflow: hidden;
                background-color: ${backgroundColor};
                text-decoration: none;
                height: 40px;
                display: flex;
                align-items: center;
            }

            .select-style:hover,
            .select-style:focus,
            .select-style:active {
                cursor: pointer;
            }

            ::slotted(.icon-face) {
                padding-right: 17px;
            }

            .select:focus {
                outline-width: 1px;
                outline-style: dashed;
                outline-color: red;
            }
            .icon-arrow {
                z-index: 1;
                position: absolute;
                right: 4px;
                display: block;
                padding: 3px;
                pointer-events: none;
            }

            .icon {
                margin-right: 7px;
                justify-content: center;
                align-items: center;
                width: 28px;
            }

            </style>
            ${getLabelTemplate('Tracking', 'select')}
            <div class="select-style">
                <select class="accessibility-selector" on-input="${onSelectInput}" id="select">
                    ${this.items.map((node,i)=>{
                        const isSelected = i === sI;
                        return html`<option value="${node.inputType}" selected="${isSelected}">${node.label}</option>`;
                    })}
                </select>

                <acc-icon icon="down" class="icon-arrow"></acc-icon>
            </div>

            <slot></slot>
            <acc-button
                aria-hidden$="${!hasControls}"
                disabled?="${!hasControls}"
                class="settings"
                label="Body Tracking Settings"
                on-click="${()=>this._handleOptionsClicked()}"></acc-button>
        `;
    }
}


customElements.define('acc-input-mode-select', InputModeSelectElement);