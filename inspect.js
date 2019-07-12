
const fs = require('fs');
const demo = require('./demo.js');
const toml = require('./toml.js');

const cliSpec = [
    { name: 'artifact', defaultOption: true }
];

const usageSpec = {
    title: 'Demo CLI - demo inspect',
    shortDescription: 'Inspect the source and test data (artifacts) of a demo',
    examples: [],
    formats: [
        'demo inspect source',
        'demo inspect data'
    ],
    options: [],
    longDescription: ['This is a long description of demo inspect'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo inspect' from outside of a demo shell");
    }

    // TODO: implement --help
    // TODO: implement interactively choose inspect type

    if (!args.hasOwnProperty('artifact')) {
        exit(1, "Run 'demo inspect source' or 'demo inspect data'");
    }

    switch (args.artifact) {
    case 'source':
        if (!fs.existsSync('/demo/Demofile.source')) {
            exit(1, "Can't run 'demo inspect source' without /demo/Demofile.source");
        }
        inspectSource('/demo/Demofile.source', exit);
        exit(0);
        
    case 'data':
        if (!fs.existsSync('/demo/Demofile.data')) {
            exit(1, "Can't run 'demo inspect data' without /demo/Demofile.data");
        }
        inspectData('/demo/Demofile.data', exit);
        exit(0);
        
    default:
        exit(1, "Run 'demo inspect source' or 'demo inspect data'");
    }
}

function inspectSource(file, exit) {
    try {
        printSourceInfo(file, exit);
    } catch (error) {
        exit(1, "demo inspect source' exited unexpectedly: " + error.toString());
    }
}

function printSourceInfo(file, exit) {
    var data = toml.parse(file, exit);
    assertHasDataForSource(data, exit);
    var source = data.source;
    
    console.log("---");
    console.log("");
    console.log("Source code [" + source.name + "]:");
    console.log("");
    console.log(source.description);
    console.log("");
    console.log("\tauthors: " + source.authors.join(', '));
    console.log("\tlicense: " + source.license);
    console.log("\tversion: " + source.version);
    console.log("");
    console.log("\tdirectory: " + source.dir);
    console.log("\tentrypoints: " + source.entrypoints.join(', '));
    console.log("");
    console.log("\tnotable:");
    for (var key in source.note) {
        if (source.note.hasOwnProperty(key)) {
            var note = source.note[key];
            console.log("\t\t" + "(" + key + ") " + note.description + ":");
            console.log("\t\t" + note.file);
        }
    }
    console.log("");
    console.log("Run 'demo share source' to copy this directory into your shared directory.");
    console.log("Run 'demo sync source' to copy changes in your shared directory to this directory.");
    
    console.log("");
    console.log("---");
    
}

function assertHasDataForSource(data, exit) {
    if (!(data.source
          && data.source.name
          && data.source.dir
          && data.source.description
          && data.source.version
          && data.source.license
          && data.source.entrypoints)) {

        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Needs a [source] section with preconfigured labels");
    }

    // TODO: iterate through the notes
    // and make sure they have all the needed data.
}

function inspectData(file, exit) {
    try {
        printDataInfo(file, exit);
    } catch (error) {
        exit(1, "demo inspect' exited unexpectedly: " + error.toString());
    }
}

function printDataInfo(file, exit) {
    var data = toml.parse(file, exit);
    assertHasDataForSource(data, exit);
    data = data.data;
    
    console.log("---");
    console.log("");
    console.log("Test data:");
    console.log("");
    console.log(data.description);
    console.log("");
    for (var key in data.preconfigured) {
        if (data.preconfigured.hasOwnProperty(key)) {
            var dataset = data.preconfigured[key];

            console.log("\t[" + dataset.description + "]:");
            console.log("");
            console.log("\tdirectory: " + dataset.dir + ":");
            console.log("\tfiles: ");
            for (var i = 0; i < dataset.files.length; i++) {
                console.log("\t* " + dataset.files[i] + ": " + dataset.fileDescriptions[i]);
            }
            dataset.extra.forEach(function(field) {
                var desc = data.extra[field];
                var value = dataset[field];
                console.log("\t" + desc + ": " + value);
            });
            console.log("");
            console.log("\tsource: " + dataset.source);
            console.log("\turl: " + dataset.url);
            console.log("");
        }
    }
    console.log("");
    console.log("---");
}

function assertHasDataForSource(data, exit) {
    if (!(data.data
          && data.data.description
          && data.data.preconfigured)) {

        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Needs a [data] section with preconfigured labels");
    }

    // TODO: iterate through the preconfigured datasets
    // and extras and make sure they have all the needed data.
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
