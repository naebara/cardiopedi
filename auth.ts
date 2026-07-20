import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { enqueueAuditEvent } from '@/lib/audit';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

function auditLoginFailure(user: { email: string; id: string }) {
    enqueueAuditEvent({
        action: 'LOGIN_FAILED',
        actor: { email: user.email, id: user.id },
        category: 'AUTH',
        entityId: user.id,
        entityType: 'User',
        status: 'FAILURE',
        summary: 'Autentificare esuata',
    });
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedEmail = z.string().email().safeParse(credentials?.email);
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    if (!user.password) {
                        auditLoginFailure(user);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;

                    auditLoginFailure(user);
                } else if (parsedEmail.success) {
                    const user = await getUser(parsedEmail.data);
                    if (user) auditLoginFailure(user);
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            if (token?.id && session.user) session.user.id = token.id as string;
            return session;
        },
    },
    events: {
        signIn({ user }) {
            if (!user.email) return;
            enqueueAuditEvent({
                action: 'LOGIN_SUCCESS',
                actor: { email: user.email, id: user.id },
                category: 'AUTH',
                entityId: user.id,
                entityType: 'User',
                summary: 'Autentificare reusita',
            });
        },
        signOut(message) {
            if (!('token' in message) || typeof message.token?.email !== 'string') return;
            const { token } = message;
            const email = token.email as string;
            const id = typeof token.id === 'string' ? token.id : undefined;

            enqueueAuditEvent({
                action: 'LOGOUT',
                actor: { email, id },
                category: 'AUTH',
                entityId: id,
                entityType: 'User',
                summary: 'Deconectare din admin',
            });
        },
    },
});
