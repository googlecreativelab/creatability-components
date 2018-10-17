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

/**
 * Keyboard Shortcut Observer
 * Observe keyboard events on the document, if the event.key combination matches
 * the pattern provided invoke the provided handler.
 */
export class KeyboardShortcutObserver {

    public allowPropagation: boolean = false;
    //the value as it is originally set (not as regexp)
    private __directShortcut: string | RegExp;
    private __shortcutRegExp: RegExp;
    private __keysDown: string[] = [];
    private __isConnected: boolean;


    public set pattern(s: string | RegExp) {
        this.__directShortcut = s;
        if(typeof s === 'string') {
            //format
            let short = s
                .replace('.', '\\.')
                .replace('(', '\\(')
                .replace(')', '\\)')
                .replace('[', '\\[')
                .replace(']', '\\]')
                .replace(/(Space|Spacebar)/i, ' ')
                .replace(/(Ctr|Ctrl)/i, 'Control');

            this.__shortcutRegExp = new RegExp(short, 'gi');
        } else {
            this.__shortcutRegExp = s;
        }
    }

    public get pattern(): string | RegExp {
        return this.__directShortcut;
    }


    /**
     * Construct a new observer to listen to the keyboard
     * @param pattern the keyboard pattern to look for, examples are "Shift P", "Control m", "Meta s"
     * @param __onTriggerHandler the handler to invoke when a match is found
     * @param name a name to identify the shortcut
     */
    constructor(
        pattern: string | RegExp,
        private __onTriggerHandler: ( observer: KeyboardShortcutObserver ) => void,
        public name: string = 'unnamed'
    ){
        this.pattern = pattern;
        this.connect();
    }


    public connect() {
        if(this.__isConnected){
            return;
        }
        document.addEventListener('keydown', this.__onKeyDown, true);
        document.addEventListener('keyup', this.__onKeyUp, true);
        this.__isConnected = true;
    }

    public disconnect() {
        if(!this.__isConnected){
            return;
        }
        document.removeEventListener('keydown', this.__onKeyDown, true);
        document.removeEventListener('keyup', this.__onKeyUp, true);
        this.__isConnected = false;
    }

    public isConnected(): boolean {
        return this.__isConnected;
    }

    private matches(): boolean {
        const keys = this.__keysDown.join(' ');
        if(this.__shortcutRegExp.test(keys)) {
            return true;
        }
        return false;
    }

    @autobind
    private __onKeyDown(event: KeyboardEvent) {
        if(!this.pattern){
            return;
        }
        this.__keysDown.push(event.key);
    }

    @autobind
    private __onKeyUp(event: KeyboardEvent) {
        //console.log(this.name, this.pattern, ' == ', this.__keysDown);
        if(!this.pattern){
            return;
        }
        if (this.matches()) {
            this.__onTriggerHandler(this);
            if (this.allowPropagation) {
                event.stopPropagation();
            }
        }
        this.__keysDown = [];
    }

}