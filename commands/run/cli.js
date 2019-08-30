const fs = require('fs');
const yaml = require('js-yaml');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'config', defaultOption: true },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {
    if (!fs.existsSync('/demo/demo.yml')) {
        return {
            ok: false,
            error_msg: "Can't run 'demo run' without /demo/demo.yml"
        };
    }

    var useDefault = !args.hasOwnProperty('config');
    return parseDemofile('/demo/demo.yml',
                         useDefault, args.config);
}

function parseDemofile(file, useDefault, config_name) {
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
        return msg + " Run 'demo configure run --check to learn more";
    }
    
    if (!data.run)
        return {
            ok: false,
            msg: withHelp("/demo/demo.yml needs a 'run' section.")
        };

    if (!data.run.configs || data.run.configs.length == 0)
        return {
            ok: false,
            msg: withHelp("/demo/demo.yml doesn't have 'configs' under 'run'.")
        };

    if (useDefault) {
        return {
            ok: true,
            
            name: data.run.configs[0].name,
            isDefault: true,
            script: data.run.configs[0].script
        };
    }

    for (var i = 0; i < data.run.configs.length; i++) {
        var config = data.run.configs[i];
        if (config.name == config_name) {
            return {
                ok: true,
                name: data.run.configs[i].name,
                isDefault: (i == 0),
                script: data.run.configs[i].script
            };
        }
    }

    var names = data.run.configs.map(function(config) {
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
