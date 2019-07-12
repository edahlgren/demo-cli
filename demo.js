
const fs = require('fs');

function insideDemo() {
    return fs.existsSync('/demo');
}

module.exports = {
    inside: insideDemo
};
