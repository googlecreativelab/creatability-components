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
import { html, LitElement } from '@polymer/lit-element';
import { bodyFontFamily, outlineBorderColor } from "./styles";
import { property } from './decorators';
import autobind from 'autobind-decorator';
import { setBooleanAttribute } from '../utils';

interface UIElements {
    label:string;
    disabled: boolean;
}

export class GroupElement extends LitElement {

    /**
     * a keyboard shortcut to access the element
     */
    @property({ type: String })
    public shortcut: string = '';

    /**
     * the group label
     */
    @property({ type: String })
    public label:string = '';

    /**
     * disable the entire group, make it inaccessible
     */
    @property({ type: Boolean })
    public disabled: boolean = false;

    /**
     * hide the label of the group, only provide for aria
     */
    @property({ type: Boolean })
    public hideLabel: boolean = false;

    private __shortcutObserver: KeyboardShortcutObserver;

    connectedCallback() {
        super.connectedCallback();
        this.__shortcutObserver = new KeyboardShortcutObserver(this.shortcut, this._handleShortcut, 'focus group');
    }

    disconnectedCallback() {
        this.__shortcutObserver.disconnect();
        super.disconnectedCallback();
    }

    _propertiesChanged(props: any, changed: any, prev: any) {
        if(!changed) {
            return;
        }
        if(changed.hasOwnProperty('disabled')) {
            setBooleanAttribute(this, 'disabled', this.disabled);
            this.setAttribute('aria-hidden', props.disabled);
        }
        if(changed.hasOwnProperty('shortcut') && this.__shortcutObserver) {
            this.__shortcutObserver.pattern = props.shortcut;
        }
        return super._propertiesChanged(props, changed, prev);
    }

    @autobind
    _handleShortcut() {
        this.focus();
        this.dispatchEvent(new CustomEvent('shortcut', { bubbles: true }));
    }

    focus() {
        super.focus();
        if(this.disabled){
            return;
        }
        const h2 = this.shadowRoot.querySelector('h2');
        if(h2) {
            h2.focus();
        }
    }

    _render({label, disabled}:UIElements){

        return html`
        <style>

            :host([disabled]) * {
                opacity: 0.5;
                pointer-events: none;
            }
            .container {
                padding: 30px 24px;
                border-bottom: 1px solid ${outlineBorderColor};
            }

            .title {
                font-family: ${bodyFontFamily};
                font-size: 18px;
                padding: 0;
                font-weight: 700;
                text-transform: capitalize;
                display: block;
                margin: 0 0 20px 0;
            }
        </style>
        <div class="container" aria-label="${label} Group" tabIndex="${disabled ? -1 : 0}">
            ${(!this.hideLabel && this.label && this.label != '')
                ? html`<h2 tabindex="-1" class="title">${label}</h2>` : ''
            }
            <slot tabIndex="${disabled ? -1 : 0}"></slot>
        </div>
        `;
    }
}


customElements.define('acc-group', GroupElement);