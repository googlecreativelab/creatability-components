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

import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';


/**
 * `<acc-optgroup>` is an element to designate a group within an <acc-select>
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
export class OptgroupElement extends LitElement {

    @property({ type: String })
    public label: string = '';

    @property({ type: Boolean })
    public disabled: boolean = false;

    _render({ label }: any) {
        return html`
            <style>
                :host {
                    display: none;
                }
            </style>
            <span aria-label=${label}>${label}</span>
        `;
    }

}

customElements.define('acc-optgroup', OptgroupElement);