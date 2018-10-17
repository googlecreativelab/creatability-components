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

//based on jQuery.offset() from v2.0.3

type Vec2 = { x: number, y: number };



const isTouchEvent = (c:any): c is TouchEvent =>
    c.type.indexOf('touch') === 0 && !!c.touches;

//window has a circular window.window reference
const isWindow = (elem:any)=>
    elem !== null && elem === elem.window;

const getWindow = ( elem:any ): Window =>
    isWindow(elem) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;

const isHTMLElement = (elem:any ): elem is HTMLElement =>
    typeof elem.appendChild === 'function';



/**
 * Calculate the offset of element
 * @param elem element or getBoundingClientRect() result to calculate offset of
 * @param ignoreWindowOffset should the windows scroll position be included in the offset? (false if object is fixed position)
 * @param targetBox optionally provide an object to mutate with the results (to reduce garbage collection)
 */
export function elementOffset( elem:HTMLElement|ClientRect|DOMRect, ignoreWindowOffset:boolean=true, targetBox:Vec2={x:0,y:0}): Vec2 {

    //support elements that may have a different window or document (in iframe)
    let win:Window;
    let doc:Document;

    if(isHTMLElement(elem)){
        doc = elem.ownerDocument;

        if (!doc) {
            return targetBox;
        }

        // Make sure it's not a disconnected DOM node
        if (!doc.body.contains(elem)) {
            return targetBox;
        }

        // If we don't have gBCR, just use 0,0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        if (typeof elem.getBoundingClientRect !== 'undefined') {
            const clientRect = elem.getBoundingClientRect();
            targetBox.x = clientRect.left;
            targetBox.y = clientRect.top;
        }

        //this
        win = getWindow(doc);
    } else {
        targetBox.x = elem.left;
        targetBox.y = elem.top;
        win = window;
        doc = document;
    }

    const page = { x: 0, y: 0 };
    const docElem = document.documentElement;

    if( !ignoreWindowOffset ){
        page.y = win.pageYOffset || docElem.scrollTop;
        page.x = win.pageXOffset || docElem.scrollLeft;
    }
    targetBox.y = targetBox.y + page.y - (docElem.clientTop || 0);
    targetBox.x = targetBox.x + page.x - (docElem.clientLeft || 0);

    return targetBox;
};


//used in mousePosition to reduce unneccessary garbage collection
const __tmpVec2 = { x: 0, y: 0 };

/**
 * Calculate the provided x, y values to be relative to the provided elements offset
 * @param clientX the x position to transform (event.clientX) from a MouseEvent
 * @param clientY the y position to transform (event.clientY) from a MouseEvent
 * @param element the element to make the coordinate relative to (provide either this or offset)
 * @param offset optionally provide the elements offset (reduce work if already calculated)
 * @param target optionally provide an object to be mutated with result (reduce garbage collection)
 */
export function mousePosition(clientX:number, clientY:number, element?:HTMLElement|ClientRect|DOMRect, offset?:Vec2, target?:Vec2): Vec2 {
    if(!element && !offset){
        throw new Error('mousePosition requires either element or offset be provided');
    }
    //calculate offset for element
    if(element && !offset){
        offset = elementOffset(element, false, __tmpVec2);
    }

    //otherwise if we do have an offset (even if we have an element), just use that offset
    //use ! to promise TS its not null
    offset = offset!;

    target = target || { x:-1, y: -1};

    target.x = clientX - offset.x;
    target.y = clientY - offset.y;
    return target;
};


/**
 * Calculate the position of the provided MouseEvent or TouchEvent relative to the provided element
 * @param event the MouseEvent or TouchEvent to get coordinate from
 * @param element the element to make the coordinate relative to
 * @param offset optionally provide the elements offset (to reduce work)
 * @param target optionally provide an object to be mutated with result (to reduce garbage collection)
 */
export function mousePositionFromEvent(event:MouseEvent|TouchEvent, element?:HTMLElement|ClientRect|DOMRect, offset?:Vec2, target?:Vec2): Vec2 {
    let x, y;
    if(isTouchEvent(event)){
        if(event.touches && event.touches[0]) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        } else {
            x = NaN;
            y = NaN;
        }
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    if(!element && isHTMLElement(event.target)){
        element = event.target;
    }

    if(!element){
        throw new Error('mousePositionFromEvent requires an element parameter');
    }

    return mousePosition(x, y, element, offset, target);
};