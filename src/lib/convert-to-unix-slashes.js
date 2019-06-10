import * as path from 'path';

export function convertToUnixSlashes(filepath) {
    return filepath && filepath.split(path.win32.sep).join(path.posix.sep);
}
