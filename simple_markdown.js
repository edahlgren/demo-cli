const fs = require('fs');
const Remarkable = require('remarkable');
const cli = require('command-line-args');

var compact = require('lodash/compact');
var zip = require('lodash/zip');
var max = require('lodash/max');
var padEnd = require('lodash/padEnd');

// ====================================================================

// Input path
const cliSpec = [
    { name: 'file', defaultOption: true }
];

const args = cli(cliSpec);
if (!args.file) {
    console.log("Need a path to a file");
    process.exit(1);
}

// ====================================================================

var htmlPath = (args.html ? args.html : 'out.html');
var html = [];

html = html.concat([
    '<body>'
]);

// ====================================================================

var mdParser = new Remarkable({
    html: true,
    breaks: true
});

var innerHtml = mdParser.render(fs.readFileSync(args.file, 'utf8'));
html.push(innerHtml);

// ====================================================================

html = html.concat([
    '</body>',
]);

var fd = fs.openSync('out.html', 'w');
html.forEach(function(line) {
    fs.writeSync(fd, line + '\n');
});
fs.closeSync(fd);

console.log("Created", htmlPath);
console.log("");

// ====================================================================

const htmlToText = require('html-to-text');

function tableToString(table) {
    // Determine space width per column
    // Convert all rows to lengths
    var widths = table.map(function(row) {
        return row.map(function(col) {
            return col.length;
        });
    });
    
    // Invert rows with colums
    widths = zip.apply(null, widths);
    // Determine the max values for each column
    widths = widths.map(function(col) {
        return max(col);
    });

    // Build the table
    var text = '';
    table.forEach(function(row) {
        var i = 0;
        row.forEach(function(col) {
            text += padEnd(col, widths[i++], ' ') + '   ';
        });
        if (text.length == 0)
            return;
        text += '\n';
    });
    return text;
}

function formatTable(elem, fn, options) {
    var table = [];
    function tryParseRows(elem) {
        if (elem.type !== 'tag') {
            return;
        }
        switch (elem.name.toLowerCase()) {
        case "thead":
        case "tbody":
        case "tfoot":
        case "center":
            elem.children.forEach(tryParseRows);
            return;            
        case 'tr':
            var row = [];
            elem.children.forEach(function(elem) {
                var tokens;
                if (elem.type === 'tag') {
                    if (elem.name.toLowerCase() === 'td') {
                        tokens = fn(elem.children, options).split('\n');
                        row.push(compact(tokens)[0]);
                    }
                }
            });
            table.push(row);
            break;
        }
    }
    
    elem.children.forEach(tryParseRows);
    return tableToString(table);
}

function isCode(elem, options) {
    return (options.isInPre &&
            elem.children.length == 1 &&
            elem.children[0].name == 'code');
}


var currentHeader = '';
function indent() {
    switch (currentHeader) {
    case 'h1':
        return '  ';
    case 'h2':
        return '    ';
    case 'h3':
        return '      ';
    case 'h4':
        return '        ';
    default:
        return '  ';
    }
}

function headerIndent() {
    switch (currentHeader) {
    case 'h1':
        return '  ';
    case 'h2':
        return '  ';
    case 'h3':
        return '    ';
    case 'h4':
        return '      ';
    default:
        return '  ';
    }
}

var underline = "=";
var empty = " ";
var fdout = fs.openSync('out.txt', 'w');
fs.writeSync(fdout, empty.repeat(60) + "type 'q' to exit\n");
fs.writeSync(fdout, empty.repeat(60) + "scroll to view all\n");

htmlToText.fromString(html, {
    tables: true,
    uppercaseHeadings: false,
    ignoreImage: true,
    wordwrap: null,
    format: {
        heading: function(elem, fn, options) {
            currentHeader = elem.name;            
            let text = fn(elem.children, options);
                
            fs.writeSync(fdout, '\n' + headerIndent() +
                         text + '\n');
            
            if (elem.name !== 'h1')
                fs.writeSync(fdout, headerIndent() +
                             underline.repeat(text.length) + '\n');

            fs.writeSync(fdout, '\n');
                
            return text;
        },
        paragraph: function(elem, fn, options) {
            let text = fn(elem.children, options);
            let lines = text.split('\n');
            let _indent = indent();

            if (isCode(elem, options))
                _indent += '  ';

            lines.forEach(function(line) {
                fs.writeSync(fdout, _indent + line + '\n');
            });

            if (!isCode(elem, options))
                fs.writeSync(fdout, '\n');
            
            return text;
        },
        table: function(elem, fn, options) {
            let text = formatTable(elem, fn, options);
            let lines = text.split('\n');

            lines.forEach(function(line) {
                fs.writeSync(fdout, indent() + line + '\n');
            });

            console.log(text);
            return text;
        },
        lineBreak: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write line break: " + elem.name + ": " + text);
            return text;
        },
        anchor: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write anchor: " + elem.name + ": " + text);
            return text;
        },
        orderedList: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write ordered list: " + elem.name + ": " + text);
            return text;
        },
        unorderedList: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write unordered list: " + elem.name + ": " + text);
            return text;
        },
        listItem: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write list item: " + elem.name + ": " + text);
            return text;
        },
        horizontalLine: function(elem, fn, options) {
            let text = fn(elem.children, options);
            console.log("Didn't write horizontal line: " + elem.name + ": " + text);
            return text;
        }
    }
});

fs.closeSync(fdout);
