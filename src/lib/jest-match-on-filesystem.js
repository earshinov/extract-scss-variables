/* global expect */

import * as fs from 'fs';
import * as path from 'path';

import { listFiles } from './list-files';

export function toMatchOnFileSystem(actual, expected) {
    if (!fs.existsSync(expected))
        throw new Error(`Expected path does not exist on the filesystem: ${expected}`);
    expect(fs.existsSync(actual), `Expected ${actual} to exist`).toBeTruthy();

    const actualStat = fs.lstatSync(actual);
    const expectedStat = fs.lstatSync(expected);
    if (expectedStat.isFile()) {
        expect(actualStat.isFile(), `Expected ${actual} to be a file`).toBeTruthy();
        compareFiles(actual, expected);
    }
    else if (expectedStat.isDirectory()) {
        expect(actualStat.isDirectory(), `Expected ${actual} to be a directory`).toBeTruthy();
        compareDirectories(actual, expected);
    }
    else
        throw new Error(`Expected path is neither a file nor a directory.  Cannot handle.  ${expected}`);

    return { pass: true };
}

function compareFiles(actual, expected) {
    const actualContent = fs.readFileSync(actual, 'utf-8');
    const expectedContent = fs.readFileSync(expected, 'utf-8');
    expect(actualContent, `Expected file ${actual} to match ${expected}`).toEqual(expectedContent);
}

function compareDirectories(actual, expected) {
    const actualFiles = listFiles(actual);
    const expectedFiles = listFiles(expected);

    actualFiles.sort();
    expectedFiles.sort();

    expect(actualFiles, `Expected directory ${actual} to contain the same files as ${expected}`).toEqual(expectedFiles);

    // Compare matching files
    const commonFiles = actualFiles.filter(filename => expectedFiles.includes(filename));
    for (const filename of commonFiles)
        compareFiles(path.join(actual, filename), path.join(expected, filename));
}
