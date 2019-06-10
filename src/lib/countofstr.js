/**
 * Get number of occurrences of `substring` in `str`.
 */
export function countofstr(str, substring) {
    let count = 0;
    if (str) {
        let pos = 0;
        while (true) {
            pos = str.indexOf(substring, pos);
            if (pos < 0)
                break;
            ++count;
            pos += substring.length;
        }
    }
    return count;
}
