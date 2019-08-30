const fs = require('fs');
const yaml = require('js-yaml');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'config', defaultOption: true },
    { name: 'clean', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {
    if (!fs.existsSync('/demo/demo.yml')) {
        return {
            ok: false,
            error_msg: "Can't run 'demo build' without /demo/demo.yml"
        };
    }
    
    var useDefault = !args.hasOwnProperty('config');
    var needsClean = args.hasOwnProperty('clean') && args.clean;
    
    return parseDemofile('/demo/demo.yml',
                         useDefault, args.config, needsClean);
}

function parseDemofile(file, useDefault, config_name, needsClean) {
    var data = {};
    try {
        data = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return {
            ok: false,
            msg: "failed to read " + file + " as YAML: " + e.toString()
        };
    }

    function withHelp(msg) {
        return msg + " Run 'demo configure build --check to learn more";
    }
    
    if (!data.build)
        return {
            ok: false,
            msg: withHelp("/demo/demo.yml needs a 'run' section.")
        };

    if (needsClean && !data.build.clean)
        return {
            ok: false,
            msg: withHelp("/demo/demo.yml needs a 'clean' field under 'build'")
        };

    if (!data.build.configs || data.build.configs.length == 0)
        return {
            ok: false,
            msg: withHelp("/demo/demo.yml doesn't have 'configs' under 'build'.")
        };

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

    for (var i = 0; i < data.build.configs.length; i++) {
        var config = data.build.configs[i];
        if (config.name == config_name) {
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

    var names = data.build.configs.map(function(config) {
        return config.name;
    });
    return {
        ok: false,
        error_msg: "can't find '" + config_name + "' in /demo/demo.yml. Defined configs:"
            + " [ " + names.join(', ') + " ] ?"
    };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig    
};
