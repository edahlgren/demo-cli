
function commonHelp(args) {
    return args.hasOwnProperty("help") && args.help;
}

module.exports = {
    common: commonHelp
};
