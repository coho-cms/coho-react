import { createElement } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { imageUrl, isResolved, srcset } from '@coho-cms/delivery';
import type { Asset, ImageOptions, Linked } from '@coho-cms/delivery';

/** The `<img>` attributes `CohoImage` sets itself from the asset. */
type Derived = 'src' | 'srcSet' | 'width' | 'height';

export interface CohoImageProps extends Omit<ComponentProps<'img'>, Derived>, Omit<ImageOptions, 'width' | 'height'>
{
    /**
     * The asset to show: an entry's image field, as delivery returns it. Nothing is
     * rendered for a missing image, or for a link delivery did not resolve.
     */
    readonly src: Linked<Asset> | null | undefined;

    /** The width the image is shown at, in CSS pixels. Defaults to the original's. */
    readonly width?: number;

    /**
     * The height it is shown at. Defaults to the width at the original's aspect ratio;
     * give it with `fit="fill"` to crop to a shape around the focal point.
     */
    readonly height?: number;

    /**
     * The widths to offer when `sizes` says how wide the image is shown, such as
     * `sizes="(min-width: 960px) 50vw, 100vw"`. Defaults to the edge's widths from 640.
     */
    readonly widths?: readonly number[];
}

/**
 * An image from Coho, resized at the edge: `<CohoImage src={post.hero} width={800} />`.
 *
 * With `width` alone, the browser gets the image at that width and at twice it, for
 * high-density screens. With `sizes`, it gets a range of widths to choose from. Either
 * way the `<img>` carries `width` and `height`, so the page keeps its space while the
 * image loads, and the asset's alt text unless `alt` is given. It loads lazily unless
 * told otherwise: pass `loading="eager"` for an image above the fold.
 *
 * `format` defaults to `auto`, which lets the edge send AVIF or WebP to the browsers
 * that take them. A file that is not a raster image, such as an SVG, is shown as it was
 * uploaded.
 *
 * It renders on the server and in the browser alike, with no request of its own.
 */
export function CohoImage(props: CohoImageProps): ReactElement | null
{
    const { src: asset, width, height, fit, format = 'auto', quality, background, widths, sizes, ...img } = props;
    if (asset === null || asset === undefined || !isResolved(asset)) return null;

    const natural = asset.file;
    const shownWidth = width ?? natural?.width;
    const keepsRatio = fit === undefined || fit === 'scale' || fit === 'pad';
    const shownHeight = height
        ?? (keepsRatio && shownWidth !== undefined && natural?.width && natural.height
            ? Math.round((shownWidth * natural.height) / natural.width)
            : undefined);

    const options: ImageOptions = { width: shownWidth, height, fit, format, quality, background };
    const candidates = asset.imageUrl === undefined
        ? undefined
        : sizes !== undefined
            ? srcset(asset, { ...options, widths })
            : shownWidth !== undefined
                ? srcset(asset, { ...options, densities: [1, 2] })
                : undefined;

    return createElement('img', {
        loading: 'lazy',
        decoding: 'async',
        ...img,
        alt: img.alt ?? asset.alt ?? '',
        src: imageUrl(asset, options),
        srcSet: candidates,
        sizes,
        width: shownWidth,
        height: shownHeight,
    });
}
