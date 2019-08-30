const fs = require('fs');
const yaml = require('js-yaml');


////////////////////////////////////////////////////////////////////////////////


function parseDemofile(file, checks) {
    var data = {};
    try {
        data = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to read " + file + " as YAML: " + e.toString()
        };
    }

    var messages = checks.map(function(check) {
        if (check.exec(data))
            return "";
        return check.issue;
    });

    var issues = messages.filter(function(message) {
        return message.length > 0;
    });

    if (issues.length == 0) {
        data.ok = true;
        return data;
    }

    var error_msg = "Some issues were found while parsing '" + file + "':\n";
    issues.forEach(function(issue) {
        error_msg += "  - " + issue + "\n";
    });
    error_msg += "Run 'demo configure --check' to learn more";

    return {
        ok: false,
        error_msg: error_msg
    };
}

function getInstance(image, instance) {
    var instance_base = image.replace('.', '-');
    return (instance ? instance_base + "." + instance : instance_base);
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    parse: parseDemofile,
    getInstance: getInstance
};
