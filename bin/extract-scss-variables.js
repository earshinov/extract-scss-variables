#!/usr/bin/env node

const { extractScssVariables } = require('../dist');

const USAGE = `
Example usage:
extract-scss-variables source.scss variables.scss`;


function parseCommandLine() {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error(USAGE);
        return null;
    }

    const sourceFilename = args[0];
    const variablesFilename = args[1];
    return {
        sourceFilename,
        variablesFilename,
    };
}


function main() {

    const options = parseCommandLine();
    if (!options) {
        process.exitCode = 1;
        return;
    }

    extractScssVariables(options.sourceFilename, options.variablesFilename);
}


main();
