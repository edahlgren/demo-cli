const fs = require('fs');
const demofile = require('../../util/demofile.js');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'config', defaultOption: true },
    { name: 'clean', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {

    // Parse the command args
    var useDefault = !args.hasOwnProperty('config');
    var needsClean = args.hasOwnProperty('clean') && args.clean;
    

    // Parse and check the contents of the Demofile
    var data = demofile.parse('/demo/demo.yml', checks);
    if (!data.ok)
        return data;

    
    // Parse the default config
    if (useDefault) {
        return {
            ok: true,            
            needsClean: needsClean,
            cleanScript: data.build.clean,
            name: data.build.configs[0].name,
            isDefault: true,
            script: data.build.configs[0].script
        };
    }

    
    // Parse any other config
    for (var i = 0; i < data.build.configs.length; i++) {
        var config = data.build.configs[i];
        if (config.name == args.config) {
            return {
                ok: true,
                needsClean: needsClean,
                cleanScript: data.build.clean,
                name: data.build.configs[i].name,
                isDefault: (i == 0),
                script: data.build.configs[i].script
            };
        }
    }


    // Handle config names we can't find
    var names = data.build.configs.map(function(config) {
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
    // Check for the build section
    {
        exec: function(data) {
            return data.build;
        },
        issue: "the 'build' section is required"
    },
    
    // Check that a clean script exists
    {
        exec: function(data) {
            return data.build.clean;
        },
        issue: "a 'build' clean script is required"
    },
    
    // Check for build configs
    {
        exec: function(data) {
            return data.build.configs &&
                data.build.configs.length > 0;
        },
        issue: "at least one 'build' config is required"
    }
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig    
};
