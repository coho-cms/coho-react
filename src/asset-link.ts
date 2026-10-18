import { createElement } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { downloadUrl, isResolved } from '@coho-cms/delivery';
import type { Asset, Linked } from '@coho-cms/delivery';

export interface CohoAssetLinkProps extends Omit<ComponentProps<'a'>, 'href' | 'download' | 'type'>
{
    /**
     * The asset to link to: an entry's asset field, as delivery returns it, such as a
     * PDF. Nothing is rendered for a missing asset, or a link delivery did not resolve.
     */
    readonly asset: Linked<Asset> | null | undefined;

    /** Download the file rather than open it in the browser. Defaults to `true`. */
    readonly download?: boolean;
}

/**
 * A link to an asset from Coho: `<CohoAssetLink asset={post.brochure} />`.
 *
 * Its text is the children, or else the asset's title, or else its filename. The link
 * downloads the file under its own name; pass `download={false}` to open it in the
 * browser instead, as a PDF usually would. It carries the file's media type, so a
 * browser or screen reader can say what it is.
 *
 * ⚠️ Downloading needs the asset CDN to send the file as an attachment, which it does
 * not do yet. Until it does, the link opens the file, and needs no change when it
 * starts to. It renders on the server and in the browser alike.
 */
export function CohoAssetLink(props: CohoAssetLinkProps): ReactElement | null
{
    const { asset, download = true, children, ...a } = props;
    if (asset === null || asset === undefined || !isResolved(asset) || asset.url === undefined) return null;

    const filename = asset.file?.filename;
    return createElement(
        'a',
        {
            ...a,
            href: download ? downloadUrl(asset) : asset.url,
            // Honoured only on the site's own origin; the CDN's `dl=1` covers the rest.
            download: download ? (filename ?? true) : undefined,
            type: asset.file?.mediaType,
        },
        children ?? asset.title ?? filename ?? 'Download',
    );
}
