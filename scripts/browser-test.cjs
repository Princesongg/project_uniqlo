const assert = require('node:assert/strict');
const fs = require('node:fs');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
        if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
        const data = await readFile(file);
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        if (req.headers.range) {
            const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
            if (!range) return res.writeHead(416).end();
            const start = Number(range[1]);
            const end = Math.min(range[2] ? Number(range[2]) : data.length - 1, data.length - 1);
            if (start > end) return res.writeHead(416).end();
            res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
            return res.end(data.subarray(start, end + 1));
        }
        res.end(data);
    } catch { res.writeHead(404).end(); }
});

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
        const executablePath = process.env.CHROME_PATH || (fs.existsSync(localChrome) ? localChrome : undefined);
        browser = await chromium.launch({ executablePath, headless: true });
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
            if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
        });
        const url = `http://127.0.0.1:${server.address().port}/`;
        const load = async () => {
            await page.goto(url);
            await page.evaluate(async () => {
                await Promise.all([...document.images].map(image => {
                    image.loading = 'eager';
                    return image.decode().catch(() => {});
                }));
            });
        };
        for (const width of [320, 375, 760, 768, 1024, 1200, 1201, 1280, 1350, 1440, 1599, 1600, 1919, 1920]) {
            await page.setViewportSize({ width, height: 900 });
            await load();
            const layout = await page.evaluate(() => ({
                overflow: document.documentElement.scrollWidth > innerWidth,
                missingImages: [...document.images].filter(image => !image.naturalWidth).map(image => image.src),
                clipped: [...document.querySelectorAll('.site-header__inner, .site-footer__content, .body3__gallery, .body1__banner-copy')]
                    .filter(element => element.getBoundingClientRect().right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1)
                    .map(element => element.className),
                sliders: [...document.querySelectorAll('.swiper')].every(element => !!element.swiper),
            }));
            assert.equal(layout.overflow, false, `Horizontal overflow at ${width}`);
            assert.deepEqual(layout.missingImages, [], `Images at ${width}`);
            assert.deepEqual(layout.clipped, [], `Clipped content at ${width}`);
            assert.ok(layout.sliders, `Swiper initialization at ${width}`);
            console.log(`PASS layout and assets: ${width}px`);
        }

        await page.setViewportSize({ width: 1440, height: 900 });
        await load();
        await page.waitForFunction(() => document.querySelector('.hero__slider').swiper.autoplay.running);
        assert.equal(await page.locator('.motion-control').count(), 0);
        await page.locator('.hero__slider').focus();
        assert.equal(await page.evaluate(() => document.querySelector('.hero__slider').swiper.autoplay.running), false);
        const originalSlide = await page.evaluate(() => document.querySelector('.hero__slider').swiper.activeIndex);
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(index => document.querySelector('.hero__slider').swiper.activeIndex !== index, originalSlide);
        console.log('PASS pause, resume, focus and keyboard slider controls');

        const favorite = page.locator('.body1__favorite').first();
        await favorite.click();
        assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
        await favorite.click();
        assert.equal(await favorite.getAttribute('aria-pressed'), 'false');
        const products = page.locator('.body1__product');
        for (let i = 0; i < await products.count(); i++) {
            const product = products.nth(i);
            const swatches = product.locator('.body1__swatch');
            for (let j = 0; j < await swatches.count(); j++) {
                const swatch = swatches.nth(j);
                await swatch.click();
                assert.equal(await product.locator('.body1__product-photo > img').getAttribute('src'), await swatch.getAttribute('data-image-src'));
                assert.equal(await product.locator('[aria-pressed="true"]').count(), 1);
                await product.locator('.body1__product-photo > img').evaluate(image => image.decode());
            }
        }
        console.log('PASS favorites and all product color images');

        await page.locator('.category-menu__link').first().click();
        assert.ok(await page.locator('.portfolio-notice').isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.portfolio-notice').isVisible(), false);
        assert.ok(await page.locator('.category-menu__link').first().evaluate(element => element === document.activeElement));
        await page.locator('#headerSearch').fill('크루넥');
        await page.locator('#headerSearch').press('Enter');
        assert.ok(await page.locator('.portfolio-notice').isVisible());
        assert.equal(page.url(), url);
        await page.locator('.portfolio-notice button').click();
        assert.ok(await page.locator('#headerSearch').evaluate(element => element === document.activeElement));
        assert.equal(await page.locator('[data-rolling-clone] .body4-card__link').evaluateAll(buttons => buttons.every(button => !button.closest('[inert]') && button.tabIndex === -1)), true);
        await page.evaluate(() => document.querySelector('.body4-showcase__rail').style.animationPlayState = 'paused');
        await page.locator('.body4-card__link').first().click();
        assert.ok(await page.locator('.portfolio-notice').isVisible());
        await page.keyboard.press('Escape');
        console.log('PASS portfolio notice, search, focus return and inert clones');

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await load();
        assert.ok(await page.evaluate(() => [...document.querySelectorAll('.swiper')].every(element => !element.swiper.autoplay.running)));
        assert.ok(await page.evaluate(() => [...document.querySelectorAll('video')].every(video => video.paused)));
        assert.ok(await page.evaluate(() => document.documentElement.hasAttribute('data-motion-paused')));
        await page.locator('.hero__slider').focus();
        await page.keyboard.press('ArrowRight');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.locator('.category-menu__link').first().focus();
        await page.waitForFunction(() => document.querySelector('.hero__slider').swiper.autoplay.running);
        console.log('PASS reduced motion and live preference changes');

        await page.route('**/swiper-bundle.min.js', route => route.abort());
        await load();
        await page.locator('.hero__slider').focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('.hero__slide.swiper-slide-active').getAttribute('aria-label'), '2 / 3');
        await page.locator('.body1__banner').first().focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('.body1__banner').first().locator('.body1__banner-slide:not([hidden])').count(), 1);
        assert.equal(await page.locator('.body1__banner').first().locator('.body1__banner-slide:not([hidden])').getAttribute('aria-label'), '2 / 2');
        await page.unroute('**/swiper-bundle.min.js');
        console.log('PASS Swiper failure fallback and keyboard navigation');

        for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await load();
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.screenshot({ path: `.qa-${width}.png`, fullPage: true });
            await page.locator('#body3').screenshot({ path: `.qa-gallery-${width}.png` });
        }
        assert.deepEqual(errors, [], 'Browser runtime or asset errors');
        console.log('PASS: all browser checks; screenshots saved to .qa-*.png');
    } finally {
        await browser?.close();
        server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
