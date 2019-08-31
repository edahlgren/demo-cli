const fs = require('fs');
const demofile = require('../../util/demofile.js');
const help = require('../../util/help.js');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'config', defaultOption: true },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {

    // Parse the command args
    var useDefault = !args.hasOwnProperty('config');


    // Parse and check the contents of the Demofile
    var data = demofile.parse('/demo/demo.yml', checks);
    if (!data.ok)
        return data;


    // Parse the default config
    if (useDefault) {
        return {
            ok: true,            
            name: data.run.configs[0].name,
            isDefault: true,
            script: data.run.configs[0].script
        };
    }

    
    // Parse any other config
    for (var i = 0; i < data.run.configs.length; i++) {
        var config = data.run.configs[i];
        if (config.name == args.config) {
            return {
                ok: true,
                name: data.run.configs[i].name,
                isDefault: (i == 0),
                script: data.run.configs[i].script
            };
        }
    }


    // Handle config names we can't find
    var names = data.run.configs.map(function(config) {
        return config.name;
    });
    return {
        ok: false,
        error_msg: "can't find '" + args.config
            + "' in /demo/demo.yml. Defined configs:"
            + " [ " + names.join(', ') + " ] ?"
    };
}

const checks = [
    // Check for the run section
    {
        exec: function(data) {
            return data.run;
        },
        issue: "the 'run' section is required"
    },
    
    // Check for run configs
    {
        exec: function(data) {
            return data.run.configs &&
                data.run.configs.length > 0;
        },
        issue: "at least one 'run' config is required"
    }
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig,
    help: help.common
};
