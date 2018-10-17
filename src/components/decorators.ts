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

import {LitElement} from '@polymer/lit-element/';

export interface ElementConstructor extends Function {
  is?: string;
  properties?: {[prop: string]: PropertyOptions};
  observers?: string[];
  _addDeclarativeEventListener?:
      (target: string|EventTarget,
       eventName: string,
       handler: (ev: Event) => void) => void;
}

export interface ElementPrototype extends LitElement {
  constructor: ElementConstructor;
}

/**
 * A TypeScript class decorator factory that registers the class as a custom
 * element.
 *
 * If `tagname` is provided, it will be used as the custom element name, and
 * will be assigned to the class static `is` property. If `tagname` is omitted,
 * the static `is` property of the class will be used instead. If neither exist,
 * or if both exist but have different values (except in the case that the `is`
 * property is not an own-property of the class), an exception is thrown.
 */
export function customElement(tagname?: string) {
  return (class_: {new (): LitElement}&ElementConstructor) => {
    if (tagname) {
      // Only check that tag names match when `is` is our own property. It might
      // be inherited from a superclass, in which case it's ok if they're
      // different, and we'll override it with our own property below.
      if (class_.hasOwnProperty('is')) {
        if (tagname !== class_.is) {
          throw new Error(
              `custom element tag names do not match: ` +
              `(${tagname} !== ${class_.is})`);
        }
      } else {
        Object.defineProperty(class_, 'is', {value: tagname});
      }
    }
    // Throws if tag name is missing or invalid.
    window.customElements.define(class_.is!, class_);
  };
}

/**
 * Options for the @property decorator.
 * See https://www.polymer-project.org/2.0/docs/devguide/properties.
 */
export interface PropertyOptions {
  /**
   * This field can be omitted if the Metadata Reflection API is configured.
   */
  type?: BooleanConstructor|DateConstructor|NumberConstructor|StringConstructor|
      ArrayConstructor|ObjectConstructor;
  notify?: boolean;
  reflectToAttribute?: boolean;
  readOnly?: boolean;
  computed?: string;
  observer?: string|((val: {}, old: {}) => void);
}

function createProperty(
    proto: ElementPrototype, name: string, options?: PropertyOptions): void {
  if (!proto.constructor.hasOwnProperty('properties')) {
    Object.defineProperty(proto.constructor, 'properties', {value: {}});
  }

  const finalOpts: PropertyOptions = {
    ...proto.constructor.properties![name],
    ...options,
  };

  if (!finalOpts.type) {
    console.error(
        `A type could not be found for ${name}. ` +
        'Set a type or configure Metadata Reflection API support.');
  }

  proto.constructor.properties![name] = finalOpts;
}

/**
 * A TypeScript property decorator factory that defines this as a Polymer
 * property.
 *
 * This function must be invoked to return a decorator.
 */
export function property(options?: PropertyOptions) {
  return (proto: ElementPrototype, propName: string) => {
    createProperty(proto, propName, options);
  };
}

/**
 * A TypeScript property decorator factory that converts a class property into
 * a getter that executes a querySelector on the element's shadow root.
 *
 * By annotating the property with the correct type, elements can have
 * type-checked access to internal elements.
 *
 * This function must be invoked to return a decorator.
 */
export const query = _query(
    (target: NodeSelector, selector: string) => target.querySelector(selector));

/**
 * A TypeScript property decorator factory that converts a class property into
 * a getter that executes a querySelectorAll on the element's shadow root.
 *
 * By annotating the property with the correct type, elements can have
 * type-checked access to internal elements. The type should be NodeList
 * with the correct type argument.
 *
 * This function must be invoked to return a decorator.
 */
export const queryAll = _query(
    (target: NodeSelector, selector: string) =>
        target.querySelectorAll(selector));

/**
 * Creates a decorator function that accepts a selector, and replaces a
 * property with a getter than executes the selector with the given queryFn
 *
 * @param queryFn A function that executes a query with a selector
 */
function _query(
    queryFn: (target: NodeSelector, selector: string) =>
        Element | NodeList | null) {
  return (selector: string) => (proto: ElementPrototype, propName: string) => {
    Object.defineProperty(proto, propName, {
      get(this: HTMLElement) {
        return queryFn(this.shadowRoot!, selector);
      },
      enumerable: true,
      configurable: true,
    });
  };
}