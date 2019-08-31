const fs = require('fs');

function readYAML(file) {
    var data = {};
    try {
        data = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to read " + file + " as YAML: " + e.toString()
        };
    }
    return { ok: true, yaml: data };
}

function readContent(file) {
    var contents = '';
    try {
        contents = fs.readFileSync(file, 'utf8');
    } catch (error) {
        return {
            ok: false,
            error_msg: "couldn't read file '" + file + "': " + error.toString()
        };
    }
    return {
        ok: true,
        content: contents
    };
}

function writeContent(file, content) {
    try {
        fs.writeFileSync(file, content);
    } catch (error) {
        return {
            ok: false,
            error_msg: "couldn't write file '" + file + "': " + error.toString()
        };
    }
    return { ok: true };
}

function readdir(dir) {
    var paths = [];
    try {
        paths = fs.readdirSync(dir);
    } catch (error) {
        return {
            ok: false,
            error_msg: "couldn't read directory '" + dir + "': " + error.toString()
        };
    }
    return { ok: true, paths: paths };
}

module.exports = {
    readContent: readContent,
    writeContent: writeContent,
    readdir: readdir,
    readYAML: readYAML
};
