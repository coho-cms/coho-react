import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Asset } from '@coho-cms/delivery';
import { CohoAssetLink, CohoImage } from '../src/index.ts';
import type { CohoAssetLinkProps, CohoImageProps } from '../src/index.ts';

const BASE = 'https://assets.test/p1';

const PHOTO: Asset = {
    url: `${BASE}/a/abc/culvert.png`,
    imageUrl: `${BASE}/i/abc/culvert.png`,
    file: { filename: 'culvert.png', mediaType: 'image/png', width: 2000, height: 1000 },
    focalPoint: { x: 0.25, y: 0.75 },
    alt: 'A culvert under Elm Street',
};

const SVG: Asset = {
    url: `${BASE}/a/def/logo.svg`,
    file: { filename: 'logo.svg', mediaType: 'image/svg+xml' },
};

const PDF: Asset = {
    url: `${BASE}/a/123/roundabout-functionality.pdf`,
    file: { filename: 'roundabout-functionality.pdf', mediaType: 'application/pdf' },
    title: 'How a roundabout works',
};

const image = (props: CohoImageProps): string => renderToStaticMarkup(createElement(CohoImage, props));
const link = (props: CohoAssetLinkProps): string => renderToStaticMarkup(createElement(CohoAssetLink, props));

/** The attributes of the one element in `html`, decoded, named in lowercase as a browser reads them. */
function attributes(html: string): Record<string, string>
{
    return Object.fromEntries(
        [...html.matchAll(/ ([a-zA-Z-]+)="([^"]*)"/g)].map(([, name, value]) => [name!.toLowerCase(), value!.replaceAll('&amp;', '&')]),
    );
}

test('an image at a width gets it at 1x and 2x, keeping its aspect ratio', () =>
{
    const img = attributes(image({ src: PHOTO, width: 400 }));
    assert.equal(img.src, `${BASE}/i/abc/culvert.png?w=400&fm=auto`);
    assert.equal(img.srcset, `${BASE}/i/abc/culvert.png?w=400&fm=auto 1x, ${BASE}/i/abc/culvert.png?w=800&fm=auto 2x`);
    assert.equal(img.width, '400');
    assert.equal(img.height, '200');
    assert.equal(img.alt, 'A culvert under Elm Street');
    assert.equal(img.loading, 'lazy');
});

test('with sizes, an image offers a range of widths up to the original', () =>
{
    const img = attributes(image({ src: PHOTO, sizes: '(min-width: 960px) 50vw, 100vw', widths: [640, 1200, 3840] }));
    assert.equal(img.sizes, '(min-width: 960px) 50vw, 100vw');
    assert.equal(img.srcset, `${BASE}/i/abc/culvert.png?w=640&fm=auto 640w, ${BASE}/i/abc/culvert.png?w=1200&fm=auto 1200w`);
    assert.equal(img.width, '2000');
});

test('a fill crops to the shape given, around the focal point', () =>
{
    const img = attributes(image({ src: PHOTO, width: 300, height: 300, fit: 'fill', format: 'webp' }));
    assert.equal(img.src, `${BASE}/i/abc/culvert.png?w=300&h=300&fit=fill&fm=webp&fx=0.25&fy=0.75`);
    assert.match(img.srcset!, /w=600&h=600&fit=fill&fm=webp&fx=0.25&fy=0.75 2x$/);
    assert.equal(img.height, '300');
});

test('the page can override alt, loading and any other attribute', () =>
{
    const img = attributes(image({ src: PHOTO, width: 400, alt: '', loading: 'eager', className: 'hero' }));
    assert.equal(img.alt, '');
    assert.equal(img.loading, 'eager');
    assert.equal(img.class, 'hero');
});

test('an image that is not raster is shown as uploaded, with no srcset', () =>
{
    const img = attributes(image({ src: SVG, width: 120 }));
    assert.equal(img.src, SVG.url);
    assert.equal(img.srcset, undefined);
    assert.equal(img.alt, '');
});

test('a missing or unresolved image renders nothing', () =>
{
    assert.equal(image({ src: undefined }), '');
    assert.equal(image({ src: null }), '');
    assert.equal(image({ src: { _id: 'x', _unresolved: 'depth' } }), '');
});

test('an asset link downloads the file, named by its title, with its media type', () =>
{
    const html = link({ asset: PDF });
    assert.match(html, />How a roundabout works<\/a>$/);
    const a = attributes(html);
    assert.equal(a.href, `${PDF.url}?dl=1`);
    assert.equal(a.download, 'roundabout-functionality.pdf');
    assert.equal(a.type, 'application/pdf');
});

test('an asset link can open the file instead, with text of its own', () =>
{
    const html = link({ asset: PDF, download: false, children: 'Read the guide', className: 'doc' });
    assert.match(html, />Read the guide<\/a>$/);
    const a = attributes(html);
    assert.equal(a.href, PDF.url);
    assert.equal(a.download, undefined);
    assert.equal(a.class, 'doc');
});

test('with no title an asset link reads as its filename', () =>
{
    assert.match(link({ asset: { ...PDF, title: undefined } }), />roundabout-functionality\.pdf<\/a>$/);
});

test('a missing or unresolved asset renders no link', () =>
{
    assert.equal(link({ asset: undefined }), '');
    assert.equal(link({ asset: { _id: 'x', _unresolved: 'absent' } }), '');
    assert.equal(link({ asset: { file: { filename: 'x.pdf' } } }), '');
});
