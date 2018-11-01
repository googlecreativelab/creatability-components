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

import { InputType } from '../components/types';
/**
 * any event coming from an AbstractInputElement should include
 * these properties in its details
 */
export interface InputEventDetails {
    inputType:InputType;
    position:[number, number];
}

/**
 * extend CustomEventInit to make details a required property
 */
export type ACCInputEventInit = CustomEventInit<InputEventDetails>;

/**
 * Every event coming from an AbstractInputElement
 */
export class ACCInputEvent extends CustomEvent<InputEventDetails> {

    /**
     * Dispatched when an inputs properties have changed
     * @event
     */
    public static CHANGE: string = 'change';

    /**
     * Dispatched when an input's controls modal closes
     * @event
     */
    public static CONTROLS_CLOSE: string = 'controlsclose';

    /**
     * Dispatched when an input's controls modal opens
     * @event
     */
    public static CONTROLS_OPEN: string ='controlsopen';

    /**
     * Dispatched when the input is beginning to initialize and load itself
     * @event
     */
    public static INITIALIZING: string = 'initializing';

    /**
     * Dispatched when the input has completed initializing itself
     * @event
     */
    public static READY: string = 'ready';

    /**
     * Dispatched every time theres an update, this is 60fps for webcams
     * @event
     */
    public static TICK: string = 'tick';

    /**
     * Dispatches every time there is a new value from the input
     * @event
     */
    public static INPUT: string = 'input';

    /**
     * Dispatched when the input has been stopped
     * @event
     */
    public static STOP: string = 'stop';

    constructor(type:string, eventInitDict:ACCInputEventInit){
        super(type, eventInitDict);
    }
}