const fs = require('fs');

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
        contents: contents
    };
}

module.exports = {
    readContent: readContent
};
