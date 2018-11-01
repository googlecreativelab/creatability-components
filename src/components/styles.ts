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

import { camelCaseToHyphenated } from './../utils';

/**
 * Individually declared styles
 *
 * any variable intended to be exposes as a theming css variable should
 * be the same as variable name but hyphenated with two leading dashes
 * i.e. accentColor in css is --accent-color
 */


 /**
  * outline the styles here
  */
const styles: any = {
    labelColor: 'black',
    backgroundColor: 'white',
    buttonBorderColor: '#AEB0B5',
    buttonBorderWidth: '2px',
    buttonFontSize:'18px',
    buttonFontWeight: 'normal',
    buttonJustifyContent: 'center',
    accentColor: '#235BEC',//'#1658F5',
    accentOffColor: '#aaaaaa',
    accentBorderRadius: '0%',
    bodyFontFamily: 'Karla',
    titleFontFamily: 'Poppins',
    iconSize: '25px',
    fillColor: 'black',
    outlineBorderColor : '#AEB0B5',
}


/**
 * make a value from styles a css variable available for themes
 * @param styleVariable the variable from styles you to make a CSS variable
 */
const applyVariable = ( styleVariable: string ) =>
        `var(--${camelCaseToHyphenated(styleVariable)}, ${styles[styleVariable]})`;

export const labelColor = applyVariable('labelColor');
export const backgroundColor = applyVariable('backgroundColor');
export const titleFontFamily = applyVariable('titleFontFamily');
export const bodyFontFamily = applyVariable('bodyFontFamily');

// this is one is nested with priority to --button-background-color
// otherwise defaults to --background-color or its default value above
export const buttonBackgroundColor = `var(--button-background-color, ${backgroundColor})`;
export const buttonBorderColor = applyVariable('buttonBorderColor');
export const buttonBorderWidth = applyVariable('buttonBorderWidth');
export const buttonFontSize = applyVariable('buttonFontSize');
export const buttonFontWeight = applyVariable('buttonFontWeight');
export const buttonJustifyContent = applyVariable('buttonJustifyContent');
export const buttonLabelColor = `var(--button-label-color, ${labelColor})`

export const accentColor = applyVariable('accentColor');
export const accentOffColor = applyVariable('accentOffColor');
export const accentBorderRadius = applyVariable('accentBorderRadius');

export const iconSize = applyVariable('iconSize');

export const fillColor = applyVariable('fillColor');

export const outlineBorderColor = applyVariable('outlineBorderColor')



export const labelStyleChunk = (selector: string= 'label') => `
    ${selector} {
        font-family: ${bodyFontFamily};
        font-size: 18px;
        padding: 0px 0px 20px 0px;
        font-weight: 700;
        text-transform: capitalize;
        display: block;
        cursor: pointer;
        color: ${labelColor};
    }`;