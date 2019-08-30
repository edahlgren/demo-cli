const util = require('util');
const fs = require('fs');
const path = require('path');

const toml = require('toml');
const cli = require('command-line-args');

const convert = require('./convert');

const cliSpec = [
    { name: 'toml' },
    { name: 'md' },
    { name: 'html' },
    { name: 'outdir' }
];

function main() {
    const args = cli(cliSpec);
    checkArgs(args);

    var topic = path.basename(args.md, '.md');
    var vars = parseVars(args, topic);

    var out = path.join(args.outdir, topic);
    var config = {
        vars: vars,
        template: {
            md: args.md,
            html: args.html
        },
        out: {
            md: out + '.md',
            html: out + '.html',
            text: out + '.text'
        }
    };

    convert.makeDocs(config);
}

function checkArgs(args) {
    if (!args.toml) {
        console.log("Need a path to a toml file");
        process.exit(1);
    }
    if (!args.md) {
        console.log("Need a path to a markdown template");
        process.exit(1);
    }
    if (!args.html) {
        console.log("Need a path to an html template");
        process.exit(1);
    }
    if (!args.outdir) {
        console.log("Need a path to an output directory");
        process.exit(1);
    }
}

function parseVars(args, topic) {
    var content = '';
    try {
        var content = fs.readFileSync(args.toml, 'utf8');
    } catch (error) {
        throw error;
    }

    var tomlData = {};
    try {
        tomlData = toml.parse(content);
    } catch (error) {
        throw error;
    }

    switch (topic) {
    case 'run':
        return dataForRun(tomlData);
    case 'build':
        return dataForBuild(tomlData);
    case 'docs':
        return dataForDocs(tomlData);
    case 'data':
        return dataForData(tomlData);
    case 'source':
        return dataForSource(tomlData);
    default:
        return tomlData;
    }
}

function dataForRun(data) {
    var out = {
        title: data.title,
        run: {
            description: data.run.description,
        }
    };
    
    out.run['preconfigured'] = objectToArray(data.run.preconfigured);
    // Add (default) to default run
    out.run.preconfigured.forEach(function(config) {
        if (config.name === data.run.default) {
            config.description += " (default)";
        }
    });
    
    out.run['examples'] = objectToArray(data.run.examples);
    out['input'] = objectToArray(data.input);
    out['output'] = objectToArray(data.output);
    out['algorithms'] = objectToArray(data.algorithms);
    out['params'] = objectToArray(data.params);

    return out;
}

function dataForBuild(data) {
    var out = {
        title: data.title,
        build: {},
        source: {}
    };

    out.build['preconfigured'] = objectToArray(data.build.preconfigured);
    // Add (default) to default build
    out.build.preconfigured.forEach(function(config) {
        if (config.name === data.build.default) {
            config.description += " (default)";
        }
    });
    
    out.source['preconfigured'] = objectToArray(data.source.preconfigured);
    // Transform [file] -> [{name: repo, file: file}]
    // for build_files and build_artifacts
    out.source.preconfigured.forEach(function(repo) {
        var files = [];
        var artifacts = [];
        for (let i = 0; i < repo.build_files.length; i++) {
            files.push({
                name: repo.name,
                file: repo.build_files[i]
            });
        }
        for (let i = 0; i < repo.build_artifacts.length; i++) {
            artifacts.push({
                name: repo.name,
                file: repo.build_artifacts[i]
            });
        }
        repo.build_files = files;
        repo.build_artifacts = artifacts;
    });
    
    return out;
}

function dataForDocs(data) {
    var out = {
        title: data.title,
        source: {},
        papers: {}
    };

    out.source['preconfigured'] = objectToArray(data.source.preconfigured);
    out.source.preconfigured.forEach(function(repo) {
        repo.docs = objectToArray(repo.docs);
    });

    out.papers = objectToArray(data.papers);
    out.papers.forEach(function(paper) {
        paper.keywords = paper.keywords.join(', ');
    });

    return out;
}

function dataForData(data) {
    var out = {
        title: data.title,
        data: {}
    };

    out.data['preconfigured'] = objectToArray(data.data.preconfigured);
    out.data.preconfigured.forEach(function(dataset) {
        dataset.files = objectToArray(dataset.files);
        dataset.files.forEach(function(file) {
            file.meta = objectToArray(file.meta);
        });
    });
    
    return out;
}

function dataForSource(data) {
    var out = {
        title: data.title,
        source: {}
    };
    
    out.source['preconfigured'] = objectToArray(data.source.preconfigured);
    out.source.preconfigured.forEach(function(repo) {
        repo.authors = repo.authors.join(", ");
        repo.docs = objectToArray(repo.docs);
        repo.notable_files = objectToArray(repo.notable_files);
    });

    return out;
}

function objectToArray(orig) {
    var out = [];
    for (var key in orig) {
        let newobj = { name: key };

        let child = orig[key];
        for (var attr in child) {
            let field = child[attr];
            if (attr === "options") {
                if (field.length == 0)
                    newobj[attr] = "none";
                else
                    newobj[attr] = field.join(", ");
            } else {
                newobj[attr] = field;
            }
        }

        out.push(newobj);
    }
    return out;
}

main();
