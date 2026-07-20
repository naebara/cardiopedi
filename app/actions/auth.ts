'use server';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { enqueueAuditEvent } from '@/lib/audit';
import { isMailConfigured, sendMail } from '@/lib/mail';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

export type ForgotPasswordState = {
    message: string;
    status: 'error' | 'idle' | 'success';
};

const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Email invalid'),
});

function generateTemporaryPassword() {
    return randomBytes(9).toString('base64url');
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function requestPasswordReset(_prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
    const parsed = forgotPasswordSchema.safeParse({
        email: formData.get('email'),
    });

    if (!parsed.success) {
        return {
            message: 'Introdu un email valid.',
            status: 'error',
        };
    }

    if (!isMailConfigured()) {
        return {
            message: 'Trimiterea de email nu este configurata inca.',
            status: 'error',
        };
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    const successMessage = 'Daca emailul exista, vei primi o parola temporara in cateva minute.';

    if (!user) {
        return {
            message: successMessage,
            status: 'success',
        };
    }

    const previousPassword = user.password;
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
        data: { password: hashedPassword },
        where: { id: user.id },
    });

    try {
        await sendMail({
            subject: 'Parola temporara Cardiopedi',
            text: [
                `Buna${user.name ? `, ${user.name}` : ''},`,
                '',
                'A fost solicitata resetarea parolei pentru contul tau Cardiopedi.',
                `Parola temporara este: ${temporaryPassword}`,
                '',
                'Dupa autentificare, schimba parola din Setari cont.',
                '',
                'Daca nu ai solicitat aceasta resetare, contacteaza admnistratorul.',
            ].join('\n'),
            to: email,
        });
    } catch (error) {
        await prisma.user.update({
            data: { password: previousPassword },
            where: { id: user.id },
        });
        console.error('Password reset email error:', error);
        enqueueAuditEvent({
            action: 'PASSWORD_RESET_FAILED',
            actor: { email: user.email, id: user.id },
            category: 'AUTH',
            entityId: user.id,
            entityType: 'User',
            status: 'FAILURE',
            summary: 'Resetarea parolei nu a putut fi finalizata',
        });
        return {
            message: 'Emailul de resetare nu a putut fi trimis. Parola a ramas neschimbata.',
            status: 'error',
        };
    }

    enqueueAuditEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        actor: { email: user.email, id: user.id },
        category: 'AUTH',
        entityId: user.id,
        entityType: 'User',
        summary: 'Resetare de parola finalizata prin email',
    });

    return {
        message: successMessage,
        status: 'success',
    };
}
