"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFiles = loadFiles;
const glob_1 = require("glob");
async function loadFiles(dir) {
    const isDev = __filename.endsWith('.ts');
    const fullPath = `${process.cwd().replaceAll('\\', '/')}/${isDev ? 'src' : 'dist'}`;
    const files = await (0, glob_1.glob)(`${fullPath}/${dir}/**/*.${isDev ? 'ts' : 'js'}`);
    files.forEach(file => delete require.cache[require.resolve(file)]);
    return files;
}
