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

import { fastMap } from './utils';


export type vec2 = [number, number];
const isVec2 = (v: any): v is vec2 => Array.isArray(v) && v.length === 2 && typeof v[0] === 'number';

const identity = <T>(v: T): T => v;
const sq = (v: number) => v * v;


export const add = (a: vec2, b: vec2, result?: vec2): vec2 =>
    fastMap(a, (val: number, i: number) => val + b[i], result) as vec2;


export const angleBetween = (a: vec2, b: vec2): number =>
    Math.atan2(b[1] - a[1], b[0] - a[0]);


export const copy = (a: vec2, result: vec2= [NaN, NaN]): vec2 =>
    fastMap(a, identity, result);


export const distance = (a: vec2, b: vec2): number =>
    Math.sqrt( sq(b[0] - a[0]) + sq(b[1] - a[1]) );


export const equal = (a: vec2, b: vec2): boolean =>
    a[0] === b[0] && a[1] === b[1];


export function lerp(a: vec2, b: vec2, t: number, result: vec2= [NaN, NaN]): vec2 {
    result[0] = (b[0] - a[0]) * t + a[0];
    result[1] = (b[1] - a[1]) * t + a[1];
    return result;
}

export const magnitude = ([x, y]: vec2): number =>
    x * x + y * y;


export const normalize = (a: vec2, result: vec2= [ NaN, NaN ]) => {
    let mag = magnitude(a);
    const [x, y] = a;
    if (mag > 0) {
        mag = 1.0 / Math.sqrt(mag);
        result[0] = x * mag;
        result[1] = y * mag;
    }
    return result;
};


export const scale = (a: vec2, b: vec2|number, result?: vec2): vec2 =>
    fastMap(a, (val: number, i: number) => val * (isVec2(b) ? b[i] :  b), result) as vec2;


export const sub = (a: vec2, b: vec2, result?: vec2): vec2 =>
    fastMap(a, (val: number, i: number) => val - b[i], result) as vec2;


export function toCartesian([x, y]: vec2, result: vec2= [ NaN, NaN ]): vec2 {
    result[0] = x * Math.cos(y);
    result[1] = x * Math.sin(y);
    return result;
}


export function toPolar([x, y]: vec2, result: vec2= [ NaN, NaN ]): vec2 {
    result[0] = Math.sqrt(x * x + y * y);
    result[1] = Math.atan2(y, x);
    return result;
}
