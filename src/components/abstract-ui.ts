import autobind from 'autobind-decorator';
import { setBooleanAttribute } from './../utils';
import { KeyboardShortcutObserver } from './../keyboard-shortcut-observer';
import { LitElement } from '@polymer/lit-element';
import { property } from './decorators';


export interface UIProperties {
    label:string;
    disabled: boolean;
    shortcut: string;
}

export class AbstractUIElement extends LitElement {
    /**
     * the label for the element, useful for display as well as screen readers
     */
    @property({ type: String })
    public label: string = '';

    /**
     * disable the element, make it inaccessible
     */
    @property({ type: Boolean })
    public disabled: boolean = false;

    /**
     * a keyboard shortcut to access the element
     */
    @property({ type: String })
    public shortcut: string = '';

    protected _shortcutObserver: KeyboardShortcutObserver;


    public connectedCallback() {
        super.connectedCallback();
        this._shortcutObserver = new KeyboardShortcutObserver(this.shortcut, this._handleShortcut);
    }


    public disconnectedCallback() {
        this._shortcutObserver.disconnect();
        super.disconnectedCallback();
    }

    /**
     * The function called whenever the keyboard shortcut is performed
     */
    @autobind
    protected _handleShortcut() {

        this.dispatchEvent(new CustomEvent('shortcut', {bubbles : true, composed : true}))
    }


    public _propertiesChanged(props: any, changed: any, prev: any) {
        if(!changed) {
            return super._propertiesChanged(props, changed, prev);
        }

        //set or update the keyboard shortcut pattern
        if(typeof changed.shortcut !== 'undefined' && this._shortcutObserver) {
            this._shortcutObserver.pattern = props.shortcut;
        }

        //update whether this UI element is disabled or not
        if(typeof changed.disabled !== 'undefined') {
            setBooleanAttribute(this, 'disabled', props.disabled);
            this.setAttribute('aria-hidden', props.disabled);
        }
        super._propertiesChanged(props, changed, prev);
    }

};