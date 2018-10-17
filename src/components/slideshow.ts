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

export class SlideshowElement extends LitElement {

    private slides:Slide[] = [];
    private currentSlide:Slide;
    private __nodesObserver: NodeObserver;
    private doFadeIn:boolean;
    private doFadeOut:boolean;

    @property({ type: String })
    public closeButton: string = 'Start Playing';

    constructor() {
        super();
    }

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
        this.doFadeOut = true;
        this.doFadeIn = false;
        this.requestRender();
        setTimeout(() => {
            this.currentSlide = slide;
            this.doFadeIn = true;
            this.doFadeOut = false;
            this.requestRender();
        }, 250);
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

    focus(){
        super.focus()
        const slideContainer = this.shadowRoot.querySelector('.slideshow-container') as HTMLElement
        if (slideContainer){
            slideContainer.focus()
        }
    }

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

    _didRender(props:any, changed:any, prev:any){
        const caption = this.currentSlide ? this.currentSlide.caption : ''
        const alt = this.currentSlide ? this.currentSlide.alt : ''
        // this.shadowRoot.querySelector('#caption').setAttribute('aria-label', caption)
        this.shadowRoot.querySelector('#alt-text').setAttribute('aria-label', alt)
        /*if (this.slides.length > 0 && this.currentSlideId === this.slides.length - 1){
            (this.shadowRoot.querySelector('#slideshow-start-button') as HTMLElement).focus()
        }*/
        super._didRender(props, changed, prev);
    }

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
                }
                
                .slide {
                    opacity: 0;
                    transition: opacity 0.25s ease-out;
                    width: 100%;
                    position: absolute;
                }
                                
                .slide.fadeIn {
                    opacity: 1;
                }

                button[disabled]{
                    opacity: 0.25;
                    pointer-events: none;
                }

                .slide.fadeOut {
                    opacity: 0;
                }
                
                img,
                video {
                    width: 100%;
                    height: 300px;
                    margin-bottom: 40px;
                }
                
                p {
                    text-align: center;
                    font-size: 18px;
                    color: ${labelColor};
                    max-width: 50%;
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

            </style>
            <div aria-label$="Carousel. ${this.slides.length.toString()} Slides" class="slideshow-container" tabindex="-1">                

                <button
                    class="nav-arrow nav-arrow-previous"
                    aria-label="Previous slide"
                    disabled?=${this.prevSlide < 0}
                    on-click="${(e:MouseEvent) => this.currentSlideId = this.prevSlide}">
                    <acc-icon icon="previous"></acc-icon>
                </button>

                <div class="slides" aria-label="Slide Content">
                    <div id="alt-text" role="img"></div>

                    ${(_currentSlide => {
                        if (_currentSlide) {
                            return html`
                            <div class$="slide ${this.doFadeIn ? 'fadeIn' : ''} ${this.doFadeOut ? 'fadeOut' : ''}">
                                ${((_el) => { if (_el && _el !== '') {
                                    return html`<img src$="${_currentSlide.image}" alt="${_currentSlide.alt}">`
                                }})(_currentSlide.image)}
                                ${((_el) => { if (_el && _el !== '') {
                                    return html`
                                        <video aria-hidden="true" src$="${_currentSlide.video}" playsinline muted autoplay></video>
                                    `
                                }})(_currentSlide.video)}

                                <p id="caption" aria-live="polite" aria-atomic="true">${_currentSlide.caption}</p>
                            </div>
                            `;
                        }
                    })(this.currentSlide)}
                </div>
                                
                <button
                    class="nav-arrow nav-arrow-next"
                    aria-label="Next slide"
                    disabled?=${this.nextSlide > this.slides.length-1}
                    on-click="${(e:MouseEvent) => this.currentSlideId = this.nextSlide}">
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
                    on-click="${() => this.dispatchEvent(new CustomEvent('close'))}">
                    ${this.closeButton}
                </button>

            </div>
           
        `;
    }
}

customElements.define('acc-slideshow', SlideshowElement);