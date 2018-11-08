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

import { AbstractUIElement, UIProperties } from './abstract-ui';
import { html } from '@polymer/lit-element';
import { bodyFontFamily, outlineBorderColor } from "./styles";
import { property } from './decorators';
import autobind from 'autobind-decorator';


type queryPattern = (v:string)=> string;

const queries:  queryPattern[] = [
    (v)=> v,
    (v)=> `acc-${v}`,
    (v)=> `[name="${v}" i]`,
    (v)=> `[label="${v}" i]`,
    (v)=> `[value="${v}" i]`,
    (v)=> `.${v}`,
    (v)=> `#${v}`
];


const extractValue = (el:any):any => {
    if(el.value) {
        if(typeof el.value === 'string') {
            if(el.value.toLowerCase() === 'true') {
                return true;
            } else if(el.value.toLowerCase() === 'false') {
                return false;
            } else if(isFinite(parseInt(el.value, 10))) {
                return parseInt(el.value, 10);
            }
        }
        return el.value;
    }
    if(el.selected) {
        if(el.selected.value){
            return el.selected.value;
        }
        return el.selected;
    }
    return null;
}

/**
 * A `<acc-group>` element. Make a group (typically within side-panel) of related
 * controls. Provides proper headings and aria-labels and consistent focusing.
 *
 * @example ```html
 *
 * <acc-group label="My Group" shortcut="Shift G"></acc-group>
 * <acc-group label="My Group" disabled></acc-group>
 * ```
 */
export class GroupElement extends AbstractUIElement {

    /**
     * hide the label of the group, only provide for aria
     */
    @property({ type: Boolean })
    public hideLabel: boolean = false;


    @autobind
    _handleShortcut() {
        this.focus();
        super._handleShortcut();
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

    getValue(name:string) {
        const el = this.query(name);
        if(!el){
            return null;
        }
        return extractValue(el);
    }

    query(name:string, eventType?: string, eventHandler?: EventHandlerNonNull):HTMLElement|null {
        const _query = () => {
            let i:number = 0;
            while(i < queries.length) {
                const el = this.querySelector(queries[i](name));
                if(el !== null){
                    return el as HTMLElement;
                }
                i++;
            }
            const find = (baseElement: Element, query: string): Element => {
                const asAny = (baseElement as any);
                if(asAny.value && asAny.value.toLowerCase && asAny.value.toLowerCase() === query.toLowerCase()) {
                    return baseElement;
                } else if(asAny.label && asAny.label.toLowerCase && asAny.label.toLowerCase() === query.toLowerCase()) {
                    return baseElement;
                }
                let found = null;
                for(let child of baseElement.children) {
                    found = find(child, query);
                    if(found) {
                        return found;
                    }
                }
            }
            return find(this, name) as HTMLElement;
        };

        const element = _query();

        if(element && typeof eventType === 'string' && typeof eventHandler === 'function') {
            element.addEventListener(eventType, eventHandler);
        }
        return element;
    }

    _render({label, disabled}: UIProperties){

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