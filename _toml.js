#!/usr/bin/env node

/////////////////////////////////////////////////////////////////
//
// CLI
//
/////////////////////////////////////////////////////////////////

const cli = require('command-line-args');
const usage = require('command-line-usage');

const mainSpec = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'file', alias: 'f', type: String, defaultOption: true }
];

const usageSpec = [
    {
        header: 'Toml CLI',
        content: 'Testing parsing Toml files'
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'help',
                alias: 'h',
                description: 'Show this usage guide'
            },
            {
                name: 'file',
                alias: 'f',
                typeLabel: '{underline file}',
                description: 'A Toml formatted file'
            }
        ]
    }
];

/////////////////////////////////////////////////////////////////
//
// Logic
//
/////////////////////////////////////////////////////////////////

const toml = require('toml');
const fs = require('fs');

function main() {
    'use strict';

    // Parse args
    const args = cli(mainSpec);

    // Validate args
    if (args.help || !args.file) {
        const usageGuide = usage(usageSpec);
        console.log(usageGuide);
        process.exit(0);
    }

    // Do something with the input file ...
    const file = args.file;
    var contents = fs.readFileSync(file, 'utf8');
    
    var data = toml.parse(contents);
    console.dir(data);
}

// Run it
main();
