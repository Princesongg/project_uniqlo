const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { HtmlValidate } = require('html-validate');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const checkPath = (source, base = root) => {
    if (/^(?:https?:|data:|#|tel:|mailto:)/.test(source)) return;
    const file = path.resolve(base, decodeURIComponent(source.split(/[?#]/)[0]));
    assert.ok(file === root || file.startsWith(root + path.sep), `Path outside website: ${source}`);
    assert.ok(fs.existsSync(file), `Missing asset: ${source}`);
    let current = root;
    for (const part of path.relative(root, file).split(path.sep).filter(Boolean)) {
        assert.ok(fs.readdirSync(current).includes(part), `Incorrect filename case: ${source}`);
        current = path.join(current, part);
    }
};

(async () => {
    const validator = new HtmlValidate({
        extends: ['html-validate:recommended'],
        rules: {
            'void-style': 'off', // Existing HTML uses XHTML-style void tags.
            'no-trailing-whitespace': 'off',
            'prefer-native-element': 'off', // Swiper slide groups use ARIA roles.
        },
    });
    const report = await validator.validateFile(path.join(root, 'index.html'));
    assert.ok(report.valid, JSON.stringify(report.results.map(result => result.messages), null, 2));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(!html.includes('\uFFFD'), 'Invalid UTF-8 replacement character');
    for (const match of html.matchAll(/(?:src|href|data-image-src)="([^"]+)"/g)) checkPath(match[1]);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `Missing anchor: ${match[1]}`);
    for (const file of fs.readdirSync(path.join(root, 'css'))) {
        const css = fs.readFileSync(path.join(root, 'css', file), 'utf8');
        postcss.parse(css, { from: file });
        for (const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) checkPath(match[1], path.join(root, 'css'));
    }
    console.log('HTML, CSS syntax, UTF-8, anchors and case-sensitive asset paths passed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
