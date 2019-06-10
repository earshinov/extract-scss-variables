/* global expect, beforeEach, test */

/*
 * Useful links:
 * - https://jestjs.io/docs/en/using-matchers - List of available Jest matchers (toBe, toEqual, toBeTruthy etc.)
 */

import * as fs from 'fs';
import * as path from 'path';

import * as extra from 'fs-extra';
import * as tmp from 'tmp';

import { extractScssVariables } from '../src/lib/extract-scss-variables';
import { toMatchOnFileSystem } from '../src/lib/jest-match-on-filesystem';

expect.extend({ toMatchOnFileSystem });


beforeEach(() => {
    process.chdir(__dirname);
});


function runTestOnFileSystem(testFolder) {
    const { name: tempDir, removeCallback } = tmp.dirSync();
    extra.copySync(`./${testFolder}/input`, tempDir);
    extractScssVariables(
        path.join(tempDir, 'index.scss'),
        path.join(tempDir, 'variables.scss')
    );
    expect(tempDir).toMatchOnFileSystem(`./${testFolder}/output`);
    removeCallback();
}

test('Basic', () => {
    runTestOnFileSystem('basic');
});

test('Should correctly handle declaration-only file', () => {
    runTestOnFileSystem('should-correctly-handle-declaration-only-file');
});

test('Should preserve newlines between declarations', () => {
    runTestOnFileSystem('should-preserve-newlines-between-declarations');
});

test('Should handle imports', () => {
    runTestOnFileSystem('should-handle-imports');
});

test('Should preserve newlines', () => {
    runTestOnFileSystem('should-preserve-newlines');
});

test('Should extract comments', () => {
    runTestOnFileSystem('should-extract-comments');
});

test('Different target folder', () => {
    const testFolder = 'different-target-folder';
    const { name: tempDir, removeCallback } = tmp.dirSync();
    extra.copySync(`./${testFolder}/input`, tempDir);
    fs.mkdirSync(path.join(tempDir, 'variables'));
    extractScssVariables(
        path.join(tempDir, 'dist/index.scss'),
        path.join(tempDir, 'variables/variables.scss')
    );
    expect(tempDir).toMatchOnFileSystem(`./${testFolder}/output`);
    removeCallback();
});
