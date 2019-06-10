/**
 * Recursively list files in the given directory.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively list files in the given directory.
 */
export function listFiles(dir) {
    const acc = [];
    _listFiles(dir, '', acc);
    return acc;
}

function _listFiles(dir, relativeDir, acc) {
    acc = acc || [];
    const filenames = fs.readdirSync(dir);
    for (const filename of filenames) {
        const filepath = path.join(dir, filename);
        const relativePath = path.join(relativeDir, filename);
        if (fs.statSync(filepath).isDirectory())
            _listFiles(filepath, relativePath, acc);
        else {
            acc.push(relativePath);
        }
    }
    return acc;
}
