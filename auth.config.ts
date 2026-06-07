import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/forgot-password');
            const publicPaths = ['/', '/servicii', '/programari', '/despre', '/contact'];
            const isPublicPage = publicPaths.includes(nextUrl.pathname);

            if (isOnAuthPage) {
                return true;
            }

            if (isPublicPage) return true;

            if (!isLoggedIn) {
                return Response.redirect(new URL('/login', nextUrl));
            }

            return true;
        },
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;
