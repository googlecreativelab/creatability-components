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

import { LitElement, html } from '@polymer/lit-element';
import { accentColor, labelColor, outlineBorderColor, bodyFontFamily } from "./styles";
const { FlattenedNodesObserver } = require('@polymer/polymer/lib/utils/flattened-nodes-observer.js');
import { property } from './decorators';

interface NodeObservation {
    addedNodes:Element[];
    removedNodes:Element[];
}

interface NodeObserver {
    connect: ()=> void;
    disconnect: ()=> void;
    flush: ()=> void;
}

interface Slide {
    video: string;
    image: string;
    caption: string;
    alt: string;
}

/**
 * A `<acc-slideshow>` element represents a view comprised of `<acc-slide>`
 * elements with linear next / previous navigation.
 */
export class SlideshowElement extends LitElement {

    private slides:Slide[] = [];
    private currentSlide:Slide;
    private __nodesObserver: NodeObserver;
    private doFadeIn:boolean;
    private doFadeOut:boolean;

    @property({ type: String })
    public closeButton: string = 'Start Playing';

    @property({ type: String })
    public caption: string = '';

    @property({ type: String })
    public video: string = '';

    @property({ type: String })
    public alt: string = '';

    @property({ type: Boolean })
    public transition: boolean = false;


    get nextSlide() {
        let currentIndex = this.slides.indexOf(this.currentSlide);
        currentIndex++;
        return currentIndex;
        // currentIndex = (currentIndex > this.slides.length - 1) ? 0 : currentIndex;
        // return currentIndex;
    }

    get prevSlide() {
        let currentIndex = this.slides.indexOf(this.currentSlide);
        currentIndex--;
        return currentIndex;
        // currentIndex = (currentIndex < 0) ? this.slides.length - 1 : currentIndex;
        // return currentIndex;
    }

    set currentSlideId(id:number) {
        const slide = this.slides[id];

        this.transition = true
        this.currentSlide = slide
        this.caption = ''
        this.alt = ''

        setTimeout(() => {
            this.transition = false
            this.alt = slide.alt;
            this.caption = slide.caption;
            this.video = slide.video;
        }, 250)
    }

    get currentSlideId() {
        return this.slides.indexOf(this.currentSlide);
    }

    _clickHandler(event:MouseEvent) {
        event.preventDefault();
    };

    _navigate(event:MouseEvent) {
        const link:any = event.target;
        this.currentSlideId = link.getAttribute('data-slide');
        event.preventDefault();
    };

    connectedCallback(){
        super.connectedCallback();
        this.__nodesObserver = new FlattenedNodesObserver(this, this._handleNodesObserverUpdate);
    }

    /*focus(){
        super.focus()
        const slideContainer = this.shadowRoot.querySelector('.slideshow-container') as HTMLElement
        if (slideContainer){
            slideContainer.focus()
        }
    }*/

    _handleNodesObserverUpdate(info: NodeObservation) {
        info.addedNodes.forEach((node:any) => {
            if (node.tagName === 'ACC-SLIDE') {
                this.slides.push({
                    image: node.image,
                    video: node.video,
                    caption: node.caption,
                    alt: node.alt,
                });
            }
        });
        this.currentSlide = this.slides[0]
        //look at initial slide:
        this.currentSlideId = 0;
        this.requestRender();
    }

    _nextSlide(){
        this.dispatchEvent(new CustomEvent('next-slide', {bubbles : true, composed : true}));
        this.currentSlideId = this.nextSlide
    }

    _previousSlide(){
        this.dispatchEvent(new CustomEvent('previous-slide', {bubbles : true, composed : true}));
        this.currentSlideId = this.prevSlide
    }

    /*_didRender(props:any, changed:any, prev:any){
        const caption = this.currentSlide ? this.currentSlide.caption : ''
        const alt = this.currentSlide ? this.currentSlide.alt : ''
        super._didRender(props, changed, prev);
    }*/

    _render() {

        return html`
            <style>

                .slideshow-container {
                    font-family: ${bodyFontFamily};
                    background-color: var(--background-color);
                    display: block;
                }

                .slides {
                    position: relative;
                    height: 400px;
                    transition: opacity 0.25s ease-out;
                    opacity : 1;
                    display: block;
                }

                button[disabled]{
                    opacity: 0.25;
                    pointer-events: none;
                }

                img, video {
                    width: 100%;
                    height: 300px;
                    margin-bottom: 40px;
                }

                p {
                    text-align: center;
                    font-size: 18px;
                    color: ${labelColor};
                    max-width: 70%;
                    margin: 0px auto;
                }

                ul {
                    display: flex;
                    justify-content: center;
                    padding: 0;
                    margin: 0;
                    list-style: none;
                    width: 100%;
                    margin-top: 30px;
                    height: 30px;
                }

                li {
                    margin: 5px;
                    padding: 0;
                }

                li button {
                    border: none;
                    display: block;
                    width: 0;
                    height: 0;
                    padding: 5px;
                    border-radius: 100%;
                    background: ${outlineBorderColor};
                    cursor: pointer;
                }

                li button.current {
                    background: ${accentColor};
                }

                .nav-arrow {
                    position: absolute;
                    top: 350px;
                    margin: 0px;
                    background: transparent;
                    border: none;
                    z-index: 2;
                }

                .nav-arrow-previous {
                    left: 0px;
                }

                .nav-arrow-next {
                    right: 0px;
                }

                #slideshow-start-button{
                    width: 150px;
                    border: none;
                    color: ${accentColor};
                    font-size: 18px;
                    font-family: ${bodyFontFamily};
                    cursor: pointer;
                    display: block;
                    position: relative;
                    margin: 40px auto 10px;
                    background-color: transparent;
                }

                #alt-text, #live-caption{
                    height: 0px;
                    position: absolute;
                    overflow: hidden;
                }

            </style>
            <div aria-label$="Carousel. ${this.slides.length.toString()} Slides" class="slideshow-container">

                <button
                    class="nav-arrow nav-arrow-previous"
                    aria-label="Previous slide"
                    disabled?=${this.prevSlide < 0}
                    on-click="${this._previousSlide.bind(this)}">
                    <acc-icon icon="previous"></acc-icon>
                </button>

                <div class="slides" style="opacity:${this.transition?'0':'1'}" aria-label="Slide Content">
                    <img id="alt-text" alt$="${this.alt}"" src="">
                    <video aria-hidden="true" src$="${this.video}" playsinline muted autoplay></video>
                    <p id="caption"
                        aria-live="polite"
                        aria-atomic="true"
                        aria-relevant="text">${this.caption}</p>
                </div>

                <button
                    class="nav-arrow nav-arrow-next"
                    aria-label="Next slide"
                    disabled?=${this.nextSlide > this.slides.length-1}
                    on-click="${this._nextSlide.bind(this)}">
                    <acc-icon icon="next"></acc-icon>
                </button>

                <ul>
                    ${this.slides && this.slides.map((s:Slide, index)=>{
                    return html `
                        <li>
                            <button
                                on-click="${(e:MouseEvent) => this._navigate(e)}"
                                data-slide$="${index}"
                                class$="${(this.currentSlideId === index) ? 'current' : ''}"
                                aria-label$="Jump to slide ${(index+1).toString()}"></button>
                        </li>
                    `;
                    })}
                </ul>


                 <button
                    id="slideshow-start-button"
                    on-click="${() => this.dispatchEvent(new CustomEvent('close', {bubbles : true, composed : true}))}">
                    ${this.closeButton}
                </button>

            </div>

        `;
    }
}

customElements.define('acc-slideshow', SlideshowElement);