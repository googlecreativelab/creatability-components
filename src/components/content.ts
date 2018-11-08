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

import autobind from 'autobind-decorator';
import { AbstractUIElement, UIProperties } from './abstract-ui';
import { setBooleanAttribute, scaleToFill, isElement } from './../utils';
import { html } from '@polymer/lit-element';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer';
import { property } from './decorators';
import { InputModeSelectElement } from './input-mode-select';
import { ACCInputEvent } from '../events/input-event';
import { AbstractInputElement } from './abstract-input';

export interface ContentProperties extends UIProperties {
    inputSelector: string;
    grayscale: boolean;
    webcamOpacity: number;
    mounted: boolean;
}


const isFocusable = (el: any): el is { focus: ()=> void } =>
    el && typeof el.focus === 'function';

const isInputWithCanvas = (c: any): c is { canvas: HTMLCanvasElement } =>
    typeof c.canvas === 'object' && typeof c.canvas.getContext === 'function';

/**
 * An `<acc-content>` element is intended as a container for the main content area.
 * If using an AbstractInput such as `<acc-mouse-input>` or `<acc-pose-input>`
 * the coordinate space will be mapped to this element and can optionally
 * simplify display of the camera image.
 *
 * @example ```html
 *
 * <acc-content webcamOpacity="0.25" grayscale mounted></acc-content>
 * ```
 *
 */
export class ContentElement extends AbstractUIElement {


    @property({ type: String })
    public inputSelector: string = 'acc-input-mode-select';

    @property({ type: Boolean })
    public grayscale: boolean = false;

    @property({ type: Number })
    public webcamOpacity: number = 1;

    @property({ type: Boolean })
    public mounted: boolean = false;


    private __bgCtx: CanvasRenderingContext2D;
    private __inputElement: InputModeSelectElement | AbstractInputElement | null;
    private __nodesObserver: FlattenedNodesObserver;

    public set inputElement(element: InputModeSelectElement | AbstractInputElement | null) {
        if(this.__inputElement) {
            this.__inputElement.removeEventListener('tick', this._onTick);
        }
        this.__inputElement = element;
        if (!this.disabled && this.__inputElement) {
            this.__inputElement.addEventListener('tick', this._onTick);
        }
    }

    constructor() {
        super();
        this.label = this.label || 'content';
    }

    public get inputElement(): InputModeSelectElement | AbstractInputElement | null {
        if(!this.__inputElement){
            this.inputElement = document.querySelector(this.inputSelector);
        }

        return this.__inputElement;
    }

    connectedCallback() {
        super.connectedCallback();
        //this calls the getter attempting to find the element
        const poll = () =>{
            if(!this.inputElement) {
                setTimeout(poll, 10);
            }
        };
        poll();
        window.addEventListener('resize', this._onResize);
        this.__nodesObserver = new FlattenedNodesObserver(this, (items: any) => {
            items.addedNodes.forEach((node: Node) => this._onAddNode(node));
        });
    }

    disconnectedCallback() {
        this.__nodesObserver.disconnect();
        window.removeEventListener('resize', this._onResize);
        super.disconnectedCallback();
    }

    @autobind
    _handleShortcut() {
        for(let child of this.children) {
            if(isFocusable(child)) {
                child.focus();
                super._handleShortcut();
                return;
            }
        }
        //found none, so focus itself
        this.focus();
        super._handleShortcut();
    }


    _propertiesChanged(props: any, changedProps: any, prevProps: any) {
        if (!changedProps) {
            return;
        }

        super._propertiesChanged(props, changedProps, prevProps);

        setBooleanAttribute(this, 'grayscale', props.grayscale);
        setBooleanAttribute(this, 'webcam', props.webcam);
        setBooleanAttribute(this, 'mounted', props.mounted);
        if (props.disabled !== prevProps.disabled) {
            if (props.disabled && this.__inputElement) {
                this.__inputElement.removeEventListener('tick', this._onTick);
            } else if(this.__inputElement) {
                this.__inputElement.addEventListener('tick', this._onTick);
            }
        }
    }

    @autobind
    protected _onResize() {
        const wrapper = this.shadowRoot!.querySelector('.wrapper')! as HTMLElement;
        wrapper.style.height = `${window.innerHeight}px`;
        wrapper.style.width = this.__calcWidth();
        this._updateWebcamCanvas();
        //send a non-bubbling (contained) event that it did resize
        this.dispatchEvent(new CustomEvent('resize', { bubbles: false }));
    }

    @autobind
    protected _onTick(event: ACCInputEvent) {
        const input = event.target;
        const { __bgCtx } = this;


        if(isInputWithCanvas(input) && this.webcamOpacity > 0) {
            if (__bgCtx.canvas.width === 0) {
                const cw = this.clientWidth;
                const ch = this.clientHeight;
                if(cw === 0 || ch === 0) {
                    return;
                }
                __bgCtx.canvas.width = cw;
                __bgCtx.canvas.height = ch;
            }
            //RENDER THE WEBCAM TO CANVAS IF IT EXISTS
            //const camScale = scaleToFill(1240, 930, __bgCtx.canvas.width, __bgCtx.canvas.height);
            const camScale = scaleToFill(input.canvas.width, input.canvas.height, __bgCtx.canvas.width, __bgCtx.canvas.height);
            __bgCtx.drawImage(input.canvas, camScale.left, camScale.top, camScale.width, camScale.height);
        } else {
            //if theres no webcam then clear it, keep it empty
            __bgCtx.clearRect(0, 0, __bgCtx.canvas.width, __bgCtx.canvas.height);
        }
   }


   protected _onAddNode(node: Node) {
        if (isElement(node) && node.tagName === 'CANVAS') {
            const canvas = node as HTMLCanvasElement;
            canvas.contentEditable = 'true';
            canvas.tabIndex = 0;
        }
   }

   private __calcWidth(): string {
        let width = '';

        if (this.mounted) {
            const panel = document.querySelector('acc-side-panel');
            if(panel) {
                width = `${window.innerWidth - panel.clientWidth}px`
            } else {
                width = '100%';
            }
        } else {
            width = 'inherit'
        }
        return width;
   }

    protected _updateWebcamCanvas() {
        const canvas = this.shadowRoot!.querySelector('.webcam-canvas')! as HTMLCanvasElement;
        canvas.width = this.clientWidth;
        canvas.height = this.clientHeight;
        this.__bgCtx = canvas.getContext('2d');
    }


    _didRender(props: any, changedProps: any, prevProps: any) {
        this.childNodes.forEach((node) => this._onAddNode(node));
        this._updateWebcamCanvas();
        return super._didRender(props, changedProps, prevProps);
    }

    _render({ label, webcamOpacity } : ContentProperties) {

        return html`<style>
                :host {
                    display: block;
                    position:relative;
                    overflow: hidden;
                }

                :host([mounted]) {
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: 100%;
                    /*min-width: calc(100% - 300px);*/
                }

                :host([grayscale]) .webcam-canvas {
                    filter: grayscale(100%);
                }

                .webcam-canvas {
                }

                .slot-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

            </style>
            <div class="wrapper" style="width: ${this.__calcWidth()}; height: ${window.innerHeight}px;" role$="section" aria-label$="${label}">
                <canvas class="webcam-canvas" style="opacity: ${webcamOpacity};"></canvas>
                <div class="slot-container">
                    <slot></slot>
                </div>
            </div>`;
    }

}

customElements.define('acc-content', ContentElement);