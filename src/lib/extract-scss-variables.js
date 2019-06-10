import * as fs from 'fs';
import * as path from 'path';

import postcss from 'postcss';
import postcssScss from 'postcss-scss';

import { convertToUnixSlashes } from './convert-to-unix-slashes';
import { countofstr } from './countofstr';


export function extractScssVariables(sourceFilename, variablesFilename) {
    sourceFilename = path.resolve(sourceFilename);
    variablesFilename = path.resolve(variablesFilename);

    const executionData = {
        variablesFilename,
        variablesRoot: postcss.root(),
        newFile: false,

        appendNodes(nodes) {
            if (!nodes.length)
                return;

            // Normalize line endings
            for (const node of nodes) {
                node.raws.before = normalizeLineEndings(node.raws.before);
                node.raws.between = normalizeLineEndings(node.raws.between);
                node.raws.after = normalizeLineEndings(node.raws.after);
            }

            const befores = nodes.map(node => node.raws.before);

            // Separate declarations extracted from different files with \n\n
            if (this.newFile) {
                befores[0] = '\n\n';
                this.newFile = false;
            }

            this.variablesRoot.append(...nodes);

            // Override normalization automatically performed by PostCSS
            nodes.forEach((node, nodeIndex) => { node.raws.before = befores[nodeIndex]; });
        },

        finalizeNodes() {

            // Add a dummy trailing node to make PostCSS preserve semicolon of the last declaration
            this.variablesRoot.append(postcss.atRule({ name: 'preserve-trailing-newline' }));

            // Remove leading newlines
            this.variablesRoot.nodes[0].raws.before = '';
        },

        finalizeContent(str) {

            // Remove the helper node
            str = str.replace(/@preserve-trailing-newline;?/g, '');

            // Ensure one trailing newline
            str = `${str.trimEnd()}\n`;

            return str;
        },
    };
    processFile(sourceFilename, executionData);

    // Write extracted nodes to the target file
    if (executionData.variablesRoot.nodes.length > 0) {
        executionData.finalizeNodes();
        let content = executionData.variablesRoot.toString(postcssScss);
        content = executionData.finalizeContent(content);
        fs.writeFileSync(variablesFilename, content);
    }
}


function processFile(absoluteFilename, executionData) {
    const newFile = executionData.newFile;
    executionData.newFile = true;

    const fileExecutionData = {
        sourceFilename: absoluteFilename,
        changed: false,
    };
    const inputCss = fs.readFileSync(absoluteFilename, 'utf-8');
    const outputCss = postcss(postcssPlugin(executionData, fileExecutionData))
        .process(inputCss, {
            from: absoluteFilename,
            to: absoluteFilename,
            syntax: postcssScss,
        }).css;
    if (fileExecutionData.changed) {
        fs.writeFileSync(absoluteFilename, outputCss);
        executionData.newFile = true;
    }
    else
        executionData.newFile = newFile;
}


const postcssPlugin = postcss.plugin('extract-scss-variables', (executionData, fileExecutionData) => root => {

    // Insert helper nodes to prevent normalization performed by PostCSS
    insertHelperNodes(root);

    // Detect newlines (Windows / Unix)
    let newline = '\n';
    root.walk(node => {
        for (const value of [node.raws.before, node.raws.between, node.raws.after])
            if (value && value.indexOf('\r\n') >= 0) {
                newline = '\r\n';
                // Break from interation
                return false;
            }
    });

    let nodesExtracted = false;
    const nodes = [...root.nodes];
    for (let nodeIndex = 0; nodeIndex < nodes.length; ++nodeIndex) {
        const node = nodes[nodeIndex];

        // Extract functions, mixins, variables
        if (
            node.type === 'atrule' && (node.name === 'function' || node.name === 'mixin') ||
            node.type === 'decl' && node.prop[0] === '$'
        ) {
            nodesExtracted = true;

            // Include the comment preceding the node, if any
            let startIndex = nodeIndex;
            while (countofstr(nodes[startIndex].raws.before, '\n') < 2 && startIndex > 0 && nodes[startIndex - 1].type === 'comment' && !isHelperNode(nodes[startIndex - 1]))
                --startIndex;

            executionData.appendNodes(nodes.slice(startIndex, nodeIndex + 1));
            continue;
        }

        // Handle imports
        if (node.type === 'atrule' && node.name === 'import') {
            let importPath = node.params.replace(/^['"']/g, '').replace(/['"']$/, '');

            // Only handle relative paths, because we do not know how to properly import absolute ones to begin with
            if (importPath.indexOf(path.posix.sep) >= 0) {

                // Add the default extension
                let defaultExtensionAdded = false;
                if (!path.extname(importPath)) {
                    importPath = `${importPath}.scss`;
                    defaultExtensionAdded = true;
                }

                // Check if file exists.  SCSS implementation allows to import *.css files without extension,
                // and our application of *.scss extension above may not result in the correct filename.
                importPath = path.join(path.dirname(fileExecutionData.sourceFilename), importPath);
                if (defaultExtensionAdded && !fs.existsSync(importPath))
                    continue;

                processFile(importPath, executionData);
            }
        }
    }
    if (nodesExtracted) {
        fileExecutionData.changed = true;

        // Import the variables file
        let relativePath = convertToUnixSlashes(path.relative(path.dirname(fileExecutionData.sourceFilename), executionData.variablesFilename));
        if (relativePath.indexOf(path.posix.sep) < 0) {
            // Prevent the import path from being treated as absolute by scss implementation
            relativePath = `./${relativePath}`;
        }
        if (relativePath.endsWith('.scss')) {
            // Omit the .scss extension (which is the implied default)
            relativePath = relativePath.substring(0, relativePath.length - '.scss'.length);
        }
        const importNode = { type: 'atrule', name: 'import', params: `'${relativePath}'`, raws: { semicolon: true } };

        // Insert the import after file header, if any
        let nodeIndex = 0;
        while (
            nodeIndex < root.nodes.length &&
            countofstr(root.nodes[nodeIndex].raws.before, '\n') <= 1 &&
            (root.nodes[nodeIndex].type === 'comment' && !isTailHelperNode(root.nodes[nodeIndex]) || isHeadHelperNode(root.nodes[nodeIndex]))
        )
            ++nodeIndex;
        importNode.raws.before = `${newline}${newline}`;
        root.nodes[nodeIndex].before(importNode);
    }

    // Remove the helper nodes
    for (const node of root.nodes)
        if (isHelperNode(node))
            node.remove();
});


function normalizeLineEndings(str) {
    return str && str.replace(/\r\n/g, '\n').replace(/\r/, '\n');
}


function insertHelperNodes(root) {
    const firstNode = root.nodes[0];
    const firstNodeBefore = firstNode && firstNode.raws.before;

    root.prepend(postcss.comment({ text: 'HEAD' }));
    root.append(postcss.comment({ text: 'TAIL' }));

    // Override normalization automatically performed by PostCSS
    if (firstNode)
        firstNode.raws.before = firstNodeBefore;
}

function isHelperNode(node) {
    return node.type === 'comment' && (node.text === 'HEAD' || node.text === 'TAIL');
}

function isHeadHelperNode(node) {
    return node.type === 'comment' && node.text === 'HEAD';
}

function isTailHelperNode(node) {
    return node.type === 'comment' && node.text === 'TAIL';
}
