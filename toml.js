
const fs = require('fs');
const toml = require('toml');

function parseToml(file, exit) {
    if (!fs.existsSync(file)) {
        exit(1, "No demo file or demo file '" + file + "' doesn't exist"); 
    }
    
    var contents = '';
    try {
        contents = fs.readFileSync(file, 'utf8');
    } catch (error) {
        exit(1, "Couldn't read file '" + file + "': " + error.toString());
    }
    
    try {
        return toml.parse(contents);
    } catch (error) {
        exit(1, "Couldn't read file '" + file + "': " + error.toString());
    }
}

module.exports = {
    parseToml: parseToml
};
