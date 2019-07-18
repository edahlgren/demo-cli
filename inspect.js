
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
    
    console.log("");
    console.log("-------------------------------------------------------------------------------");
    console.log("| Source code in this demo");
    console.log("-------------------------------------------------------------------------------");
    console.log("");
    
    
    for (var key in source.preconfigured) {
        var repo = source.preconfigured[key];
        
        console.log("[" + key + "]");
        console.log("");

        console.log("  (description) " + repo.description);
        console.log("  (authors) " + repo.authors.join(', '));
        console.log("  (version) " + repo.version);
        console.log("  (license) " + repo.license);
        console.log("");
        
        console.log("  (files) " + repo.dir);
        for (var n in repo.notable_files) {
            var notable = repo.notable_files[n];
            console.log("    " + notable.file + " - " + notable.description);
        }
        console.log("");
    }
}

function assertHasDataForSource(data, exit) {
    if (!data.source) {
        exit(1, "Malformed Demofile: needs a [source] section");        
    }
    if (!data.source.description) {
        exit(1, "Malformed Demofile: needs a 'description' field under [source] section");        
    }
    
    for (var key in data.source.preconfigured) {
        var repo = data.source.preconfigured[key];
        if (!repo.authors) {
            exit(1, "Malformed Demofile: needs an 'author' field under [source.preconfigured." + key + "] section");
        }
        if (!repo.version) {
            exit(1, "Malformed Demofile: needs a 'version' field under [source.preconfigured." + key + "] section");
        }
        if (!repo.license) {
            exit(1, "Malformed Demofile: needs a 'license' field under [source.preconfigured." + key + "] section");
        }
        if (!repo.dir) {
            exit(1, "Malformed Demofile: needs a 'dir' field under [source.preconfigured." + key + "] section");        
        }
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
    assertHasDataForData(data, exit);
    data = data.data;

    console.log("");
    console.log("-------------------------------------------------------------------------------");
    console.log("| Data sets in this demo");
    console.log("-------------------------------------------------------------------------------");
    console.log("");
    
    for (var key in data.preconfigured) {
        var dataset = data.preconfigured[key];
        console.log("[" + key + "]");
        console.log("");

        for (var subkey in dataset) {
            if (subkey === 'extra') {
                continue;
            }
            
            var subset = dataset[subkey];
            console.log("[" + subkey + "]");
            console.log("");
        
            console.log("   (files) " + subset.dir);
            for (var i = 0; i < subset.files.length; i++) {
                console.log("       " + subset.files[i] + " - " + subset.file_descriptions[i]);
            }
            console.log("");

            subset.extra.forEach(function(field) {
                var desc = dataset.extra[field];
                var value = subset[field];
                console.log("   (" + desc + ") " + value);
            });
            console.log("");
        }
    }
    console.log("");
}

function assertHasDataForData(data, exit) {
    if (!data.data) {
        exit(1, "Malformed Demofile: needs a [data] section");
    }
    if (!data.data.description) {
        exit(1, "Malformed Demofile: needs a 'description' field under [data] section");
    }
    if (!data.data.preconfigured) {
        exit(1, "Malformed Demofile: needs a 'preconfigured' field under [data] section");
    }

    // TODO: iterate through the preconfigured datasets
    // and extras and make sure they have all the needed data.
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
