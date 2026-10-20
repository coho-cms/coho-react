# @coho-cms/react

React components for Coho CMS content: images resized at the edge, and links to download
assets. They render on the server and in the browser alike, with no request of their own,
so they work in Next.js server components, client components, and any other React app.

```bash
npm install @coho-cms/react @coho-cms/delivery
```

## Images

```tsx
import { CohoImage } from '@coho-cms/react';

<CohoImage src={post.hero} width={800} />
```

`src` is an image field as delivery returns it. With `width` alone, the browser gets the
image at that width and at twice it, for high-density screens. With `sizes`, it gets a
range of widths to choose from:

```tsx
<CohoImage src={post.hero} sizes="(min-width: 960px) 50vw, 100vw" />
```

| Prop | |
|---|---|
| `src` | The asset. A missing image, or a link delivery did not resolve, renders nothing |
| `width`, `height` | The size it is shown at. `height` defaults to the width at the original's aspect ratio |
| `fit` | `scale` (default) keeps the whole image; `fill`, `crop` and `thumb` crop to `width`×`height` around the asset's focal point; `pad` letterboxes |
| `format` | `auto` (default) lets the edge send AVIF or WebP where the browser takes them; or `avif`, `webp`, `jpg`, `png` |
| `quality` | 1 to 100; the edge's default is 75 |
| `sizes`, `widths` | A responsive image: the widths to offer default to the edge's from 640, up to the original |
| anything else | Passed to the `<img>`: `alt` overrides the asset's alt text, `loading="eager"` for an image above the fold, `className` |

The `<img>` always has `width` and `height`, so the page keeps its space while the image
loads. A file that is not a raster image, such as an SVG, is shown as it was uploaded.

## Downloads

```tsx
import { CohoAssetLink } from '@coho-cms/react';

<CohoAssetLink asset={post.brochure} />
<CohoAssetLink asset={post.brochure} download={false}>Read the guide</CohoAssetLink>
```

The link's text is its children, or the asset's title, or its filename. It downloads the
file under its own name; `download={false}` opens it in the browser instead. It carries
the file's media type. Other props, such as `className`, go to the `<a>`.

⚠️ Downloading needs the asset CDN to send the file as an attachment, which it does not do
yet: until it does, the link opens the file. The link needs no change when it starts to.

## Building your own

The components are thin. The URLs come from `imageUrl`, `srcset` and `downloadUrl` in
[`@coho-cms/delivery`](https://github.com/coho-cms/coho-delivery-sdk-typescript/tree/HEAD/packages/delivery),
which take the same options, for a `next/image` loader, a CSS background or anything else.

Assets are public to anyone holding their URL, drafts included, and deleting an asset
does not stop its URL working.

## Development

Node 22.18 or later, which runs the TypeScript tests directly.

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run lint -- --fix` reformats: Allman braces, an opening brace on its own line, and
four-space indents.

## Publishing

Run the **Publish** workflow, naming the dist-tag: `latest` for a release, or `alpha` for a
prerelease such as `0.2.0-alpha.1`, which `latest` must never point at. It checks, builds
and publishes the version in `package.json`, which cannot be published twice; then tag the
release commit, such as `v0.1.1`. Keep the version in step with `@coho-cms/delivery`,
publish that first, and keep the peer range on the delivery version whose asset helpers
this uses.

## License

Apache-2.0
