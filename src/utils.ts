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


/**
 * Is the node an Element Node? i.e. not a text item
 * @param node
 */
export const isElement = (node:any): node is Element => node.nodeType === Node.ELEMENT_NODE;

interface Many {
    length: number;
    [index: number]: any;
}

type iterator = (value: any, index: number, array?: any) => any;
// faster `map` that optionally can be provided a target `out` array
export const fastMap = <T extends Many>(arr: T, fn: iterator, out?: T): T => {
    out = (out || []) as T;

    for (let i = 0; i < arr.length ; i++) {
        out[i] = fn(arr[i], i, arr);
    }

    return out;
};

/**
 * Empty the contents of an array
 */
export const empty = <T>(array: T[]): T[] => {
    while (array.length) {
        array.pop();
    }
    return array;
};





const ua = navigator.userAgent;
export const isIOS11 = ()=> (ua.indexOf('iPad') > 0 || ua.indexOf('iPhone') > 0) && ua.indexOf('OS 11_') > 0;

// export const scaleToFill = (element:HTMLElement)=>{
//     const ww = window.innerWidth;
//     const wh = window.innerHeight;
//     let s = wh / element.height;
//     if (element.width * s < ww) {
//         s = ww / element.width;
//     }

//     const iw = element.width * s;
//     const ih = element.height * s;
//     const ix = (ww - iw) * 0.5;
//     const iy = (wh - ih) * 0.5;
//     element.style.transformOrigin = "0% 0%";
//     element.style.transform = "matrix("+s+", 0, 0, "+s+", "+ix+", "+iy+")";
// };





export const bind = (context:any, fnStr:string)=> context[fnStr] = context[fnStr].bind(context);
export const bindAll = (context:any, fnArray:string[])=> fnArray.forEach(fnStr=> bind(context, fnStr));

export const clamp = (n: number, min: number= 0, max: number= 1) =>
    Math.min(max, Math.max(min, n));

/**
 * map a value from one range of numbers to another,
 * i.e. scalemap(0.5, 0, 2, 10, 20) = 15
 * @param value
 * @param start1
 * @param stop1
 * @param start2
 * @param stop2
 * @returns {*}
 */
export const scalemap = (  value:number,  start1:number,  stop1:number,  start2:number,  stop2:number ): number =>
    start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));


interface ScaleBounds {
    scale:number;
    left:number;
    top:number;
    width:number;
    height:number;
}

export const scaleToFill = (srcWidth:number, srcHeight:number, containerWidth:number, containerHeight:number, bleed = 0, result: any= {}): ScaleBounds => {
    //subtract 'bleed' px to each side to scale larger and hide a border
    const w = srcWidth - (bleed * 2);
    const h = srcHeight - (bleed * 2);
    let s = containerHeight / h;

    if (w * s < containerWidth) {
        s = containerWidth / w;
    }

    const iw = srcWidth * s;
    const ih = srcHeight * s;
    const ix = (containerWidth - iw) * 0.5;
    const iy = (containerHeight - ih) * 0.5;

    result.left = ix;
    result.top = iy;
    result.width = srcWidth * s;
    result.height = srcHeight * s;
    result.scale = s;
    return result;
};


export const distance = (arrA:[number, number], arrB:[number,number])=>{
    const d = arrA.map((v, i)=> arrB[i] - v);
    return Math.sqrt(d[0]*d[0] + d[1]*d[1]);
};


/**
 * toggle an attribute on an element
 */
export const setBooleanAttribute = (el: Element, attr: string, isTrue: boolean)=>
    isTrue ? el.setAttribute(attr, 'true') : el.removeAttribute(attr);


/**
 * Convert a camelCase string to a lowercase hyphenated string
 * i.e. myFunVariable becomes my-fun-variable
 * @param camelString the camel-case string to convert to a hyphenated string
 */
export const camelCaseToHyphenated = ( camelString: string ) =>
    camelString.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();



export const computeStyleResult = (parent: Element | ShadowRoot, styleKey: string, value: string) => {
    const tmp = document.createElement('div');
    tmp.style.display = 'none';
    tmp.style[styleKey as any] = value;
    parent.appendChild(tmp);
    const computed = window.getComputedStyle(tmp);
    const computedValue = computed[styleKey as any];
    tmp.parentElement && tmp.parentElement.removeChild(tmp);
    return computedValue;
};

export const cssColorToArray = (css: string) => {
    function digits(){
        //hack off the trailing )
        var str = css.substr(0, css.length-1);
        //hack off rgb(, rgba(, hsl(, hsla(
        const fnStartIndex = str.indexOf('(');
        return str.substr( fnStartIndex + 1, str.length).split(',');
    }
    function makeNumbers( digitStrings: string[]){
        let i=0, l = digitStrings.length;
        const digits: number[] = [];
        for ( i=0; i<l; i++){
            //cast to numbers from Strings
            digits[i] = parseFloat( digitStrings[i] );
        }
        return digits;
    }

    return makeNumbers( digits() );
}