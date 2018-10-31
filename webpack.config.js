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


const { resolve } = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const cloneDeep = require('lodash.clonedeep');

const isDev = process.argv.find(arg => arg.includes('webpack-dev-server'))
const outputPath = resolve('dist') //isDev ? resolve('src') : resolve('dist');

const config = {
    entry : './src/index.ts',
    output : {
        path : outputPath,
        filename : 'acc-components.js'
    },
    mode : 'development',
    module : {
        rules : [
            {
                test : /\.tsx?$/,
                use : 'ts-loader',
                exclude : /node_modules/
            },
            {
                test : /\.html$/,
                use : ['text-loader']
            }
        ]
    },
    resolve : {
        extensions : ['.tsx', '.ts', '.js']
    },
    devtool : 'inline-source-map'
}

module.exports = function(argv){
    console.log(arguments)

    if (argv.mode === 'production'){
        const prod = cloneDeep(config);
        console.log('Creating Production JS Bundle')
        prod.mode = argv.mode
        prod.devtool = 'none'
        prod.output.filename = 'acc-components.min.js';

        prod.optimization = {
            minimizer: [
                new UglifyJSPlugin({
                    extractComments: true
                })
            ]
        };

        return [config, prod];
    }

    return [config];

}
