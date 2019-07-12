
const fs = require('fs');

function insideDemo() {
    return fs.existsSync('/setup/Demofile');
}

module.exports = {
    inside: insideDemo
};
