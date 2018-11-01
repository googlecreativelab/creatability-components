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

export interface ErrorEventDetails {
    name: string;
    message: string;
    stack?: string;
}

/**
 * An Event describing an encountered error.
 * Dispatching Errors is important to accessibility, it allows the developer
 * to notify the user (such as with aria-live) to assist avoiding confusion.
 */
export class ACCErrorEvent extends CustomEvent<ErrorEventDetails> {

    /**
     * Dispatched whenever there is an error
     * @event
     */
    public static ERROR: string = 'error';

    constructor(error: Error) {
        super(ACCErrorEvent.ERROR, {
            detail: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            bubbles: true,
            composed: true
        });
    }
}


