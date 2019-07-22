
const fs = require('fs');
const toml = require('toml');

function parseToml(file) {
    if (!fs.existsSync(file)) {
        throw new Error("No demo file or demo file '" + file + "' doesn't exist"); 
    }
    
    var contents = '';
    try {
        contents = fs.readFileSync(file, 'utf8');
    } catch (error) {
        throw new Error("Couldn't read file '" + file + "': " + error.toString());
    }
    
    try {
        return toml.parse(contents);
    } catch (error) {
        throw new Error("Couldn't parse TOML file '" + file + "': " + error.toString());
    }
}

module.exports = {
    parse: parseToml
};
