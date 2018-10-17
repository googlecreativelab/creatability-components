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

import { html } from "@polymer/lit-element";
import { bodyFontFamily, labelColor } from "./styles";

export function getLabelTemplate(label:string, id:string): any {
    let labelHtml = html``;
    if (label !== '') {
        labelHtml = html`
            <style type="text/css">
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
            </style>
            <label for$="${id}">${label}</label>
            `;
    }
    return labelHtml;
}
