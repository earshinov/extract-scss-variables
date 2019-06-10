module.exports = {
    input: "src/index.js",
    output: {
        file: "dist/index.js",
        format: "cjs",
    },
    external: ["fs", "path", "postcss", "postcss-scss"],
};
