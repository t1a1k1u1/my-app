// Next.js 16 renamed the `middleware.js` convention to `proxy.js`; this is
// the App Router's route-guard entry point (runs before rendering).
//
// `auth` from next-auth (Auth.js v5) doubles as the proxy function: when
// Next.js invokes the exported function with (request, event), it applies
// the `authorized` callback defined in src/lib/auth.ts to decide whether to
// let the request through, redirect to /login, or (for the login page
// itself) redirect an already-logged-in user to /stock.
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    // NextAuth's own /api/auth/* routes, and the PWA assets a browser/OS may
    // fetch without a session (manifest, icons, service worker), must stay
    // public. Everything else (all pages and all other API routes) requires
    // a session per spec §7.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon$|apple-icon$|icons/).*)",
  ],
};
