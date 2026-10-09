const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
if (path.dirname(output) !== root || (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())) {
    throw new Error('Unsafe build output directory');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const asset of ['index.html', 'css', 'js', 'images', 'video']) {
    fs.cpSync(path.join(root, asset), path.join(output, asset), { recursive: true });
}
console.log('Built dist/ with only public website assets.');
