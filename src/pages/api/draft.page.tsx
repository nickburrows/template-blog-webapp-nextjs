import { COOKIE_NAME_PRERENDER_BYPASS } from 'next/dist/server/api-utils';
import qs from 'query-string';

import {
  editorialParameters,
  guestSpaceOptionalParameters,
  guestSpaceRequiredParameters,
} from '@src/_ctf-private';
import { createGuestSpaceClient, previewClient } from '@src/lib/client';

function enableDraftMode(res) {
  res.setDraftMode({ enable: true });

  // Override cookie header for draft mode for usage in live-preview
  // https://github.com/vercel/next.js/issues/49927
  // https://github.com/vercel/next.js/blob/62af2007ce78fdbff33013a8145efbcacbf6b8e2/packages/next/src/server/api-utils/node.ts#L293
  const headers = res.getHeader('Set-Cookie');
  if (Array.isArray(headers)) {
    res.setHeader(
      'Set-Cookie',
      headers.map((cookie: string) => {
        if (cookie.includes(COOKIE_NAME_PRERENDER_BYPASS)) {
          return cookie.replace('SameSite=Lax', 'SameSite=None; Secure');
        }
        return cookie;
      }),
    );
  }
}

function getGuestSpaceParams(query: Record<string, any>) {
  if (guestSpaceRequiredParameters.every(param => query[param])) {
    return [
      ...guestSpaceRequiredParameters,
      ...guestSpaceOptionalParameters,
      ...editorialParameters,
    ].reduce((prev, curr) => ({ ...prev, [curr]: query[curr] }), {});
  }

  return null;
}

export default async (req, res) => {
  const { secret, slug, locale } = req.query;

  // Check the secret and next parameters
  // This secret should only be known to this API route and the CMS
  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // For main private we need to support guest spaces
  const guestSpaceParams = getGuestSpaceParams(req.query);
  const queryString = guestSpaceParams ? `?${qs.stringify(guestSpaceParams)}` : '';
  const client = queryString.length
    ? createGuestSpaceClient(guestSpaceParams as any)
    : previewClient;

  // Check for a slug, if no slug is passed we assume we need to redirect to the root
  if (slug) {
    try {
      const blogPageData = await client.pageBlogPost({
        slug,
        locale,
        preview: true,
      });

      const blogPost = blogPageData.pageBlogPostCollection?.items[0];

      if (!blogPost) {
        throw Error();
      }

      // Enable draft mode by setting the cookies
      enableDraftMode(res);

      // Redirect to the path from the fetched post
      res.redirect(`/${locale ? `${locale}/` : ''}${blogPost?.slug}${queryString}`);
    } catch {
      return res.status(401).json({ message: 'Invalid slug' });
    }
  } else {
    try {
      const landingPageData = await client.pageLanding({
        locale,
        preview: true,
      });

      if (!landingPageData) {
        throw Error();
      }

      // Enable draft mode by setting the cookies
      enableDraftMode(res);

      // Redirect to the root
      res.redirect(`/${locale ? `${locale}` : ''}${queryString}`);
    } catch {
      return res.status(401).json({ message: 'Page not found' });
    }
  }
};
