import { UIProperties } from './abstract-ui';
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

import autobind from'autobind-decorator';
import { AbstractUIElement } from './abstract-ui';
import { NodeObserver, NodeObservation } from './types';
import { OptgroupElement } from './optgroup';
import { isElement } from '../utils';
import { property } from "./decorators";

//@ts-ignore
const { FlattenedNodesObserver } = require('@polymer/polymer/lib/utils/flattened-nodes-observer.js');


export interface SelectProperties extends UIProperties {
    hideLabel: boolean;
}

export interface SelectableElement extends Element {
    selected:boolean;
    value:string;
}

export const isOptgroupElement = (el:any): el is OptgroupElement =>
    el && el.tagName === 'ACC-OPTGROUP';

export const isSelectableElement = (el:any): el is SelectableElement =>
    typeof el.selected === 'boolean';


/**
 * @abstract
 * AbstractSelectLitElement is an Abstract class and therefore should always be extended
 * This class manages the [selected] attribute state of all children added into its slot
 */
export class AbstractSelectElement extends AbstractUIElement {

    /**
     * hide the label visually, only provide to aria
     */
    @property({ type: Boolean })
    public hideLabel: boolean = false;

    protected _nodeChildSelector = 'acc-item';

    /**
     * a map of all <acc-optgroup> nodes
     */
    protected _groups: OptgroupElement[] = [];
    /**
     * a map of observers for optgroup child nodes
     */
    protected _groupObservers: NodeObserver[] = [];

    /**
     * a map of all <acc-item> nodes,
     * this map is flattened to include all items nested in a group
     */
    protected _nodes:SelectableElement[] = [];

    private __nodesObserver: NodeObserver;

    connectedCallback(){
        super.connectedCallback();
        this.__nodesObserver = new FlattenedNodesObserver(this, this._handleNodesObserverUpdate);
    }

    disconnectedCallback() {
        this.__nodesObserver.disconnect();
        super.disconnectedCallback();
    }

    /**
     * Select an element to change the active item.
     * @param node the node that is to be the selected element
     */
    select(node:SelectableElement){
        this.__deselectAllNodes(node);
        if(!node.selected){
            const customEvent = {
                detail: {
                    target: node
                },
                bubbles: true,
                composed: true
            };
            if(isElement(node)){
                node.selected = true;
                //node.setAttribute('selected', 'true');
            }
            this.dispatchEvent(new CustomEvent('select', customEvent));
            this.requestRender();
        }
    }

    get selected():SelectableElement {
        return this._nodes[this.selectedIndex];
    }

    get selectedIndex(){
        for(let i=0; i<this._nodes.length; i++){
            const attrValue = this._nodes[i].selected;
            if(attrValue){
                return i;
            }
        }
        return -1;
    }

    set selectedIndex(index){
        if (this._nodes[index]){
            this.select(this._nodes[index]);
        }
    }

    /**
     * Deselect all nodes, allows for an exemption
     * @param except optionally provide a single element not to deselect
     */
    private __deselectAllNodes(except:number|SelectableElement|null){
        const exceptElement = typeof except === 'number' ? this._nodes[except] : except;
        for(let i=0; i<this._nodes.length; i++){
            if(this._nodes[i] !== exceptElement){
                this._nodes[i].selected = false;
            }
        }
    }

    @autobind
    private _handleSlotNodeChanged(event:CustomEvent){
        if(isSelectableElement(event.target)){
            if(event.target.selected){
                this.select(event.target);
            }
        }
        this.requestRender();
    }

    /**
     * The handler for when nodes are added or removed from the <slot>
     * @param info the description of added and removed nodes in the last change
     */
    protected _handleNodesObserverUpdate(info: NodeObservation) {
        //remove selectable elements
        info.removedNodes.forEach(node=> isSelectableElement(node) && this._removeNode(node));
        //remove optgroups
        info.removedNodes.forEach(node => isOptgroupElement(node) && this._removeGroup(node));
        //add optgroups
        info.addedNodes.forEach(node => isOptgroupElement(node) && this._addGroup(node));
        //add selectable elements
        info.addedNodes.forEach(node=> isSelectableElement(node) && this._addNode(node));
        //warn if invalid element found
        info.addedNodes.filter(node=> isElement(node) && (!isOptgroupElement(node) && !isSelectableElement(node))).forEach(node=>{
            console.warn(`ignoring element ${node.tagName}, it is not a selectable element`);
        });

        if(this.selectedIndex === -1 && this._nodes.length){
            //none are selected
            //select the first item, that isnt a child of a disabled optgroup
            for (let i=0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                const isDisabledGroup = isOptgroupElement(node.parentElement) && node.parentElement.disabled;
                if (!isDisabledGroup) {
                    this.select(node);
                    break;
                }
            }
        }
        this.requestRender();
    }

    /**
     * Add an <acc-optgroup> element to the select
     * @param node
     */
    protected _addGroup(node:OptgroupElement) {
        const add = (itemNode: any) => {
            if ( isSelectableElement(itemNode) ) {
                this._addNode(itemNode);
            }
        };

        const remove = (itemNode: any) => {
            if (isSelectableElement(itemNode)) {
                this._removeNode(itemNode);
            }
        };

        const childObserver: NodeObserver = new FlattenedNodesObserver(node, (info: NodeObservation) => {
            info.removedNodes.forEach(remove);
            info.addedNodes.forEach(add);
            this.requestRender();
        });
        this._groups.push(node);
        this._groupObservers.push(childObserver);

        //we must go through all children nodes and add them to the flat-map
        //TODO: this doesn't support adding/removing nodes from a group :(
        for(let itemNode of node.children) {
            add(itemNode);
        }
    }

    protected _removeGroup(group: OptgroupElement) {
        const index = this._groups.indexOf(group);

        if (index === -1) {
            return;
        }

        const groupObserver = this._groupObservers[index];
        if(!groupObserver) {
            throw new Error('Has group but does not have observer!');
        }

        for(let itemNode of group.children) {
            if( isSelectableElement(itemNode) ) {
                this._removeNode(itemNode);
            }
        }
        groupObserver.disconnect();
        this._groups.splice(index, 1);
        this._groupObservers.splice(index, 1);
    }

    /**
     * Add a selectable node
     * @param node an HTMLElement that has a 'selected' property
     */
    protected _addNode(node:SelectableElement){
        if (this._nodes.indexOf(node) > -1) {
            //already in the map
            return;
        }
        node.addEventListener('change', this._handleSlotNodeChanged);
        //this._nodes.push(node);
        this._nodes = Array.from(this.querySelectorAll(this._nodeChildSelector) || []);
    }

    protected _removeNode(node:SelectableElement){
        const index = this._nodes.indexOf(node);
        if(index < 0){
            return;
        }
        this._nodes[index].removeEventListener('change', this._handleSlotNodeChanged);
        this._nodes.splice(index, 1);
    }

}