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



/**
 * usage: node watch-copy.js [destination]
 * if no destination is provided, will look for env.COMPONENTS_BUNDLE_DESTINATION
 *
 * This module listens for changes in the build directory,
 * every time files change it copies them to any directories provided as arguments
 */

const fs = require('fs');
const path = require('path');

const lead = (symbol, n)=> new Array(n).fill(symbol).join('');

const banner = (symbol, messages, shouldSpaceLine=true)=>{
    console.log(lead(symbol, 50));
    if(shouldSpaceLine){
        console.log(' ');
    }
    messages.forEach(message=>{
        console.log(`${lead(symbol, 3)} ${message}`);
    });
    if(shouldSpaceLine){
        console.log(' ');
    }
    console.log(lead(symbol, 50));
}

//support the use of a user environment variable
//set this in your shell
// export COMPONENTS_BUNDLE_DESTINATION="../cl-mouth-synth/assets"
const ENV_DEST = process.env.COMPONENTS_BUNDLE_DESTINATION;

const srcDir = './dist';
const destDirs = Array.from(process.argv).slice(2);

if(!destDirs.length && ENV_DEST){
    destDirs.push(...ENV_DEST.split(' '));
}

if(!destDirs.length){
    banner('!',[
        'watch-copy.js:',
        `No destination directories provided, exiting watch-copy`,
        `if you wish to auto-copy builds either provide a folder as an argument`,
        `or set an environment variable in shell:`,
        `export COMPONENTS_BUNDLE_DESTINATION=../my-project/assets`
    ], true);
    //its ok to fail
    process.exit(0);
}


banner('+', destDirs.map((destDir, i)=>
    `${(i+1)} -  Will copy ${srcDir} to ${destDir} on file changes`
), true)

const watcher = fs.watch('./dist', { }, (event, filename)=>{
    if(filename){
        const src = path.join(srcDir, filename);
        destDirs.forEach(destDir=>{
            const dest = path.join(destDir, filename);
            fs.copyFileSync(src, dest);
            banner('+', [`Copied ${src} to \n ${lead(' ',3)} ${dest}`], false);
        });
    }
});
