
const chalk = require('chalk');
const usage = require('command-line-usage');
const util = require('util');

const cliSpec = [
    { name: 'subcommand', defaultOption: true }
];

const example1 = "$ demo help shell";
const example2 = "$ demo help help";

const usageSpec = {
    title: 'Demo CLI - demo help',
    shortDescription: 'Learn about a Demo CLI command',
    examples: [
        {
            snippet: example1,
            desc: "Learn about the 'demo shell' command"
        },
        {
            snippet: example2,
            desc: "Show this guide"
        }
    ],
    formats: [
        'demo help <command>',
        'demo help --command <command>',
    ],
    options: [
        { name: 'command', summary: 'Show the help guide of this command'}
    ],
    longDescription: [
        "Shows a guide like this one for a Demo CLI command. See demo --help for a list of all commands."
    ],
    notes: []
};

function exec(args, exit) {
    'use strict';

    // Handle usage mistakes
    if (!args.hasOwnProperty('subcommand')) {
        exit(1, "need command in 'demo help command'");
    }

    switch (args.subcommand) {
    case 'help':
        console.log(makeHelp(usageSpec));
        break;
    default:
        exit(1, "subcommand '" + args.subcommand + "' not implemented");
    }

    exit(0);
}

function makeHelp(spec) {
    var sections = [];

    // Create the help page header
    sections.push({
        content: makeHeader(spec.title, spec.shortDescription),
        raw: true
    });

    // Add examples
    sections.push({
        header: "Examples:",
        content: makeExamples(spec.examples),
        raw: true
    });

    sections.push({
        header: "Usage:",
        content: spec.formats
    });

    if (spec.commands && spec.commands.length > 0) {
        sections.push({
            header: "Commands:",
            content: spec.commands
        });
    }
    
    if (spec.options && spec.options.length > 0) {
        sections.push({
            header: "Options:",
            content: spec.options
        });
    }

    sections.push({
        header: "Long description:",
        content: spec.longDescription
    });

    if (spec.notes && spec.notes.length > 0) {
        sections.push({
            header: "Notes and limitations:",
            content: spec.notes
        });
    }
    
    sections.push({
        header: 'Get help:',
        content: [
            '  Show this guide:\n\n    $ demo --help\n',
            '  Get help with a specific command:\n\n    $ demo help <command>\n',
        ],
        raw: true
    });
    
    return usage(sections);
}

const b = chalk.blue;
const m = chalk.magenta;

function makeHeader(title, desc) {
    return `${b(String.raw` ____`)}
${b(String.raw`|  _ \\`)}    ${chalk.bold.underline(title)}
${b(String.raw`| | | |`)}
${m(String.raw`| |_| |`)}   ${desc}
${m(String.raw`|____/`)}
`;
}

function makeExamples(examples) {
    var out = [];
    var first = true;
    examples.forEach(function(ex) {
        var fmtString = first ? "  %s:\n\n    %s" : "\n  %s:\n\n    %s";
        var formatted = util.format(fmtString, ex.desc, ex.snippet);
        out.push(formatted);
        first = false;
    });
    return out;
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec,
    makeHelp: makeHelp
};
