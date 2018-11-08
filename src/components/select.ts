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
import { backgroundColor, bodyFontFamily, labelColor } from './styles';
import { SelectableElement, AbstractSelectElement, isOptgroupElement } from './abstract-select';
import { OptgroupElement } from './optgroup';

import { html } from '@polymer/lit-element';

import './optgroup';

interface OptionItem extends SelectableElement {
    icon?: string;
    label: string;
    value: string;
}

const isItem = (n: any): n is OptionItem =>
    n && typeof n.label === 'string' && typeof n.value !== 'undefined';

const toOptgroupTemplate = (group: OptgroupElement) =>
    html`<optgroup label=${group.label} disabled?=${group.disabled}>
        ${Array.from(group.children).map(node =>
            isItem(node) ? toOptionTemplate(node) : '')}
    </optgroup>`;

const toOptionTemplate = (node: OptionItem) =>
    html`<option value="${node.value}" label="${node.label}" selected="${node.selected}">${node.label}</option>`;




/**
 * `<acc-select>` element is similar to a `<select>` element with built-in
 * labelling and aria attributes.
 *
 * @example ```html
 *
 * <acc-select label="Instruments">
 *  <acc-optgroup label="Strings">
 *      <acc-item label="guitar"></acc-item>
 *      <acc-item label="cello"></acc-item>
 *  </acc-optgroup>
 *  <acc-optgroup label="percussion">
 *      <acc-item label="drums"></acc-item>
 *      <acc-item label="tamborine"></acc-item>
 *  </acc-optgroup>
 * </acc-select>
 * ```
 */
export class SelectElement extends AbstractSelectElement  {


    get items(): OptionItem[] {
        return this._nodes as OptionItem[];
    }

    get selected(): OptionItem {
        return super.selected as OptionItem;
    }

    get value():string {
        return this.selected ? this.selected.value || this.selected.label : undefined;
    }

    @autobind
    protected _handleShortcut() {
        this.focus();
        super._handleShortcut();
    }


    focus(){
        super.focus()
        this.shadowRoot.querySelector('select').focus()
    }

    _render({ label}: any) {
        const sI = this.selectedIndex;

        //are any icons present?
        const hasIcons = this.items.some(item => !!item.icon);

        //get the label of the group this node is in
        const getItemGroupLabel = (node: OptionItem) => {
            if ( node && isOptgroupElement(node.parentElement) ) {
                return node.parentElement.label;
            }
            return null;
        };

        const self = this;
        function onSelectInput(e:Event){

            const select: HTMLSelectElement = this;

            const previous: string = !!self.selected && (self.selected.value || self.selected.label);
            const previousGroup = getItemGroupLabel(self.selected);

            const isMatch  = (item: any): boolean =>
                item && item.value === select.value && item.label === select.selectedOptions[0].label;

            let item = self.items[this.selectedIndex];
            if(!isMatch(item)) {
                for(let i=0; i<self.items.length; i++) {
                    if(isMatch(self.items[i])) {
                        item = self.items[i];
                        break;
                    }
                }
            }
            if(!item) {
                throw new Error('Selected an item that didnt exist in map');
            }


            let value = item.value || item.label;
            const group = getItemGroupLabel(item);

            if (value.indexOf('right') === 0) {
                value = value.replace('right', 'left');
            } else {
                value = value.replace('left', 'right');
            }
            const customEvent = {
                detail: {
                    target: e.target,
                    value,
                    group,
                    previous,
                    previousGroup,
                }
            };

            //'this' scope is the select box
            self.select(item);

            self.dispatchEvent(new CustomEvent('change', customEvent));
        }
        return html`
        <style>

            :host {
                padding: 5px;
            }

            :host select, button {
            }

            :host([inline]) .select-style,
            :host([inline]) label,
            *[inline] .select-style,
            *[inline] label {
                display: inline-block;
                width: auto;
            }

            :host([disabled]),
            acc-icon[disabled],
            select[disabled] {
                pointer-events: none;
                opacity: 0.25;
            }

            :host([inline]) label,
            *[inline] label {
                padding: 0 8px 0 0;
            }

            :host([inline]) select,
            *[inline] select {
                width: auto;
                display: inline-block;
                padding: 0 30px 0 0;
            }

            :host([inline]) .container,
            *[inline] .container {
                display: flex;
                align-items: baseline;
            }
            .container {
                display: inline-block;
                width: 100%;
            }

            label {
                font-family: ${bodyFontFamily};
                font-size: 18px;
                padding: 0px 0px 20px 0px;
                font-weight: 700;
                text-transform: capitalize;
                display: block;
                cursor: pointer;
                color: ${labelColor};
            }

            select {
                width: 100%;
                padding-right: 0px;
                height: 30px;
                cursor: pointer;
                display: inline-block;
                position: relative;
                font-size: 18px;
                font-family: ${bodyFontFamily};
                text-transform: capitalize;
                color: ${labelColor};
                background-color: ${backgroundColor};
                -moz-appearance:none; /* Firefox */
                -webkit-appearance:none; /* Safari and Chrome */
                appearance:none;
                border: 0;
            }

            select option,  select optgroup{
                color: black;
                background-color: white;
            }

            .select-style {
                position: relative;
                margin: 0;
                border: none;
                width: 100%;
                height: 34px;
                overflow: hidden;
                background-color: ${backgroundColor};
                text-decoration: none;

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

            .icon-arrow {
                z-index: 1;
                position: absolute;
                right: 4px;
                top: 3px;
                display: block;
                padding: 3px;
                pointer-events: none;
            }

            .icon {
                display: flex;
                width: var(--icon-size, 25px);
                height: var(--icon-size, 25px);
                justify-content: center;
                margin-right: 17px;
                align-items: center;
                background-size: 100% auto;
                background-repeat: no-repeat;
                background-position: center;
            }

            #Shape {
                fill: ${labelColor};
            }
        </style>
        <div class="container">
            <label for="select-ui">${label}</label>
            <div class="select-style">
                ${ hasIcons ? html`
                    <div class="icon" style$="background-image: url(${this.selected && this.selected.icon}); display: ${ hasIcons ? 'flex' : 'none'}">
                    </div>
                    ` : ''
                }
                <select
                    id="select-ui"
                    class="accessibility-selector"
                    disabled?="${this.disabled}"
                    on-input="${onSelectInput}" id="select">
                    ${Array.from(this.children).map(node => {
                        if (isOptgroupElement(node)) {
                            return toOptgroupTemplate(node);
                        } else if(isItem(node)) {
                            return toOptionTemplate(node);
                        }
                        return '';
                    })}
                </select>
                <acc-icon disabled?="${this.disabled}" aria-hidden="true" icon="down" class="icon-arrow"></acc-icon>
            </div>
        </div>
        `;
    }
}

customElements.define('acc-select', SelectElement);