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

import { backgroundColor, labelColor } from './styles';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';
import { SnackBarElement } from './snackbar';
import { isElement } from '../utils';

export interface AbstractModalChangedProperties {
    ariaHidden:string;
    tabIndex: string;
    display: string;
}


const walkParents = (element: Node, target:Node[]= []): Node[] =>{
    if(element.parentNode) {
        const host = (element.parentNode as any).host;
        const result = host ? host : element.parentNode;
        target.push(result);
        walkParents(result, target);
    }
    return target;
}

/**
 * Find Nodes that could be hidden without breaking the modal
 * @param element the element to inspect the children of
 * @param exclusions elements that can not be hidden, such as the parents of the modal
 * @param target the array to push the nodes into
 */
const findHideableNodes = (element: Element, exclusions:Node[], target: Node[] = []): Node[] => {
    return Array.from(element.children).reduce((mem, child) => {
        if(exclusions.indexOf(child) > -1) {
            findHideableNodes(child, exclusions, mem);
        } else if( isElement(child)) {
            mem.push(child);
        }
        return mem;
    }, target);
}


export abstract class AbstractModalElement extends LitElement {

    private _returnFocusTo:HTMLElement

    protected abstract _renderModalBody(props:any): any;

    protected static _openModals:AbstractModalElement[] = [];

    private static _hiddenElements:Map<Element,AbstractModalChangedProperties> = new Map();

    @property({ type: Boolean })
    public open:boolean = false;

    @property({ type: Boolean })
    public closable:boolean = false;

    @property({ type: Boolean })
    public exclusive:boolean = false;

    @property({ type: Number })
    public priority: number = 0;

    protected static _showOnTop(){

        //go through and hide the other abstract modals
        AbstractModalElement._openModals.sort((a, b) => b.priority - a.priority)
        //show the first, hide the rest
        AbstractModalElement._openModals.forEach((modal, index) => {
            if (index === 0){
                modal.setAttribute('aria-hidden', 'false')
                modal.style.display = 'inherit'
                modal.style.zIndex = '100000'
                modal.focus()
            } else {
                modal.setAttribute('aria-hidden', 'true')
                modal.style.display = 'none'
                modal.style.zIndex = null
            }
        })
    }

    protected static _findHideableElements(instance: AbstractModalElement): Element[] {
        const parents = walkParents(instance);
        return findHideableNodes(document.body, parents)
            //is an element, not just a node
            .filter(isElement)
            //is not already in the Map
            // .filter(el => !AbstractModalElement._hiddenElements.has(el))
            //is not a Modal
            .filter(el => !(el instanceof AbstractModalElement))
            //is not a Snackbar
            .filter(el => !(el instanceof SnackBarElement));
    }


    /**
     * close the modal, called internally via _propertiesChanged
     * as the result of the open property changing
     */
    protected _open(){
        const previousLength = AbstractModalElement._openModals.length;

        //capture the currently focused element
        const currentFocus = document.activeElement as HTMLElement
        if (currentFocus !== this && currentFocus !== document.body &&
                currentFocus && !(currentFocus instanceof AbstractModalElement)){
            this._returnFocusTo = currentFocus
        }

        if (AbstractModalElement._openModals.indexOf(this) === -1){
            this.dispatchEvent(new CustomEvent('open'))
            AbstractModalElement._openModals.push(this)
        }


        AbstractModalElement._findHideableElements(this).forEach((item: HTMLElement) => {
            if (!AbstractModalElement._hiddenElements.has(item)){
                AbstractModalElement._hiddenElements.set(item, {
                    tabIndex : item.getAttribute('tabindex'),
                    ariaHidden : item.getAttribute('aria-hidden'),
                    display : item.style.display
                });
            }
            item.setAttribute('tabindex', '-1');
            item.setAttribute('aria-hidden', 'true');
            if (this.exclusive){
                item.style.display = 'none'
            }
        });

        if (AbstractModalElement._openModals.length && !previousLength){
            this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
        }

    }

    /**
     * close the modal, called internally via _propertiesChanged
     * as the result of the open property changing
     */
    protected _close(){

        const previousLength = AbstractModalElement._openModals.length

        //remove itself from the list
        const index = AbstractModalElement._openModals.indexOf(this)
        if (index !== -1){
            this.dispatchEvent(new CustomEvent('close'))
            AbstractModalElement._openModals.splice(index, 1);
        }

        //hide this element
        this.setAttribute('aria-hidden', 'true')
        this.style.display = 'none'

        if (AbstractModalElement._openModals.length === 0){

            //unhide all the elements
            AbstractModalElement._hiddenElements.forEach(({tabIndex, ariaHidden, display}, item:HTMLElement) => {
                // item.style.display = null;
                if (tabIndex !== null){
                    item.setAttribute('tabindex', tabIndex);
                } else {
                    item.removeAttribute('tabindex');
                }
                if (ariaHidden !== null){
                    item.setAttribute('aria-hidden', ariaHidden);
                } else {
                    item.removeAttribute('aria-hidden');
                }
                if (display !== null){
                    item.style.display = display
                } else {
                    item.style.display = null
                }
            });
            //clear the array
            AbstractModalElement._hiddenElements.clear();

            //trigger resize in case that's relevant
            this.dispatchEvent(new CustomEvent('resize', { bubbles: true }));

            //return focus to the sidepanel
            //figure out where to return focus to
            if (this._returnFocusTo){
                this._returnFocusTo.focus();
                this._returnFocusTo = null;
            } else {
                //assumes that it's coming from the splash screen
                const sidepanel = (document.querySelector('acc-side-panel') as HTMLElement);
                if (sidepanel){
                    sidepanel.focus();
                }
            }
        }

        if (previousLength && !AbstractModalElement._openModals.length){
            this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
        }
    }

    focus(){
        super.focus();
        const container = this.shadowRoot.querySelector('.container') as HTMLElement;
        if (container){
            container.focus();
        }
    }

    _propertiesChanged(props: any, changed: any, prev: any) {
        if (
            (changed && changed.hasOwnProperty('open')) ||
            (changed && changed.hasOwnProperty('exclusive'))
        ){
            if (props.open){
                this._open();
            } else {
                this._close();
            }
        }
        AbstractModalElement._showOnTop();
        super._propertiesChanged(props, changed, prev);
    }

    _didRender(props: any, changed: any, prev: any) {
        AbstractModalElement._showOnTop();
    }

    _render(props:any){
        return html`<style>

            :host {
                position: absolute;
            }

            :host .container {
                position: fixed;
                color: ${labelColor};
                width: 100%;
                height: 100%;
                top: 0px;
                left: 0px;
                overflow: hidden;
            }
            </style>
            ${this.open ? html`
                <div tabindex="0" class="container" style="display: ${props.open ? 'block' : 'none'}; : ''}">
                    ${this._renderModalBody(props)}
                </div>
            ` : html``}
        `;

    }

    protected _handleCloseClick(){
        this.removeAttribute('open')
        this.dispatchEvent(new CustomEvent('close'));
    }

}
