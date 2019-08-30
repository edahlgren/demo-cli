
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const util = require('util');

const demo = require('../../util/demo.js');
const sync = require('../sync/sync.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'complete', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo share',
    shortDescription: 'Sync a directory in the demo to /shared',
    examples: [],
    formats: [
        'demo share',
    ],
    options: [],
    longDescription: ['This is a long description of demo share'],
    notes: []
};

// TODO: implement dir

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo sync' from outside of a demo shell");
    }

    // Is there even a shared directory in the first place? We put
    // it in a standard place so it's easy to find.
    if (!fs.existsSync('/shared')) {
        exit(0, "Nothing to sync, no shared directory");
    }

    var verbose = args.hasOwnProperty('verbose') && args.verbose;
    var allowDelete = args.hasOwnProperty('complete') && args.complete;

    sync.doRsync(process.cwd(), true /* shared */, allowDelete, verbose);
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};