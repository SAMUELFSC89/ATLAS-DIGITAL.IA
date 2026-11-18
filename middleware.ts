import { next, rewrite } from '@vercel/functions/middleware';

/** Hosts that belong to the Atlas platform itself. Any other host is a client domain connected to a finalized site. */
const ATLAS_HOST = /(^|\.)atlasdigital\.ia\.br$|\.vercel\.app$|^localhost$|^127\.0\.0\.1$/;

export const config = { matcher: '/:path*' };

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (ATLAS_HOST.test(url.hostname)) return next();
  return rewrite(new URL(`/api/contact?expressEndpoint=site&view=published&host=${encodeURIComponent(url.hostname)}`, url));
}
