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
import { property, customElement } from './decorators';


/**
 * <acc-item label="Label" [ icon="" selected name=""]>
 * An HTML tag to reprsent a selectable item,
 * The parent element renders this item into its shadow-dom
 */
export class ItemElement extends LitElement {

    @property({ type: String })
    public icon:string = '';

    @property({ type: String })
    public name:string = '';

    @property({ type: String })
    public label:string = '';

    @property({ type: String })
    public value:string = '';

    @property({ type: Boolean })
    public selected:boolean = false;

    @property({ type: Boolean })
    public disabled:boolean = false;

    _propertiesChanged(props: any, changed: any, previous: any) {
        if (changed) {
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    changed,
                    previous
                }
            }));
        }
        return super._propertiesChanged(props, changed, previous);
    }

    _render(_props:object) {
        return html``;
    }

}

customElements.define('acc-item', ItemElement);