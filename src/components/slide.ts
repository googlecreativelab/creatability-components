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
 * A `<acc-slide>` element represents the data of a slide within a slideshow,
 * The parent element renders this item into its shadow-dom.
 *
 * @example ```html
 *
 * <acc-slide caption="Caption" [ image="" video=""]>
 * ```
 */
export class SlideElement extends LitElement {

    @property({ type: String })
    public video:string = '';

    @property({ type: String })
    public image:string = '';

    @property({ type: String })
    public caption:string = '';

    @property({ type: String })
    public alt:string = '';

    _propertiesChanged(props: any, changed: any, prev: any) {
        if (props.alt === ''){
        	console.warn('slide image needs alt text')
        }
        super._propertiesChanged(props, changed, prev);
    }

    _render(_props:object) {
        return html`<slot></slot>`;
    }

}

customElements.define('acc-slide', SlideElement);