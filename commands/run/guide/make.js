const path = require('path');

const render = require('../../docs/render');
const demofile = require('../../../util/demofile');


////////////////////////////////////////////////////////////////////////////////


function make(demo_file, template, out_dir) {
    
    // Parse the demofile
    var demo = demofile.parse(demo_file, checks);
    if (!demo.ok)
        return demo;
    
    var variables = {
        // Must be available
        description: demo.run.description,
        configs: demo.run.configs,
        examples: demo.run.examples.map(function(example) {
            return {
                description: example.description,
                commandline: example.args.join(' ')
            };
        }),

        // Filled in below if available
        input_files: [{ format: "(none)" }],
        output_files: [{ format: "(none)" }],
        args_choose: [{ description: "(none)" }],
        args_any: [{ options: "(none)" }]
    };

    if (demo.io && demo.io.input)
        variables.input_files = demo.io.input;
    if (demo.io && demo.io.output)
        variables.output_files = demo.io.output;

    if (demo.args && demo.args.choose_one)
        variables.args_choose = demo.args.choose_one.map(function(choices) {
            return {
                description: choices.description,
                choices: choices.choices.map(function(choice) {
                    return {
                        options: choice.flags.join(', '),
                        default: choice.default,
                        description: choice.description
                    };
                })
            };
        });

    if (demo.args && demo.args.choose_any)
        variables.args_any = demo.args.choose_any.map(function(choice) {
            return {
                options: choice.flags.join(', '),
                default: (choice.default ? choice.default : "(none)"),
                description: choice.description
            };
        });

    return render.doc({
        vars: variables,
        template: template,
        html: path.join(out_dir, "run.html"),
        text: path.join(out_dir, "run.txt")
    });        
}

const checks = [
    {
        exec: function(data) {
            return data.run;
        },
        issue: "need a 'run' section"
    },
    {
        exec: function(data) {
            return data.run && data.run.description;
        },
        issue: "need a description under 'run'"
    },
    {
        exec: function(data) {
            return data.run && data.run.configs &&
                data.run.configs.length > 0;
        },
        issue: "need at least 1 config under 'run'"
    },
    {
        exec: function(data) {
            if (!data.run || !data.run.configs)
                return false;
            
            for (var i = 0; i < data.run.configs.length; i++) {
                if (!data.run.configs[i].description)
                    return false;
                if (!data.run.configs[i].name)
                    return false;
                if (!data.run.configs[i].script)
                    return false;
            }
            
            return true;
        },
        issue: "need a description, name, and script for each config under 'run'"
    },
    {
        exec: function(data) {
            return data.run && data.run.examples &&
                data.run.examples.length > 0;
        },
        issue: "need at least 1 example under 'run'"
    },
    {
        exec: function(data) {
            if (!data.run || !data.run.examples)
                return false;
            
            for (var i = 0; i < data.run.examples.length; i++) {
                if (!data.run.examples[i].description)
                    return false;
                if (!data.run.examples[i].args)
                    return false;
            }
            
            return true;
        },
        issue: "need a description and args for each example under 'run'"
    },
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make
};
