'use client';

import { authenticate } from '@/app/actions/auth';
import { useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartPulse } from 'lucide-react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Box,
} from '@mantine/core';
import classes from './Login.module.css';

export default function LoginView() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className={classes.wrapper}>
            <section className={classes.loginShell}>
                <Paper className={classes.paper}>
                    <Link className={classes.brand} href="/">
                        <span><HeartPulse size={22} /></span>
                        <div>
                            <strong>Cardiopedi</strong>
                            <small>Admin doctor</small>
                        </div>
                    </Link>

                    <Box mb={28}>
                        <p className={classes.eyebrow}>Panou de control</p>
                        <h2 className={classes.title}>Autentificare medic</h2>
                    </Box>

                    <form action={formAction}>
                        <input name="redirectTo" type="hidden" value="/admin" />
                        <Box mb={20}>
                            <TextInput
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                label="Email"
                                size="md"
                                classNames={{ label: classes.label, input: classes.input }}
                                withAsterisk={false}
                            />
                        </Box>

                        <Box mb={28}>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                required
                                label="Parola"
                                size="md"
                                classNames={{ label: classes.label, innerInput: classes.input }}
                                withAsterisk={false}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            loading={isPending}
                            className={classes.submitButton}
                        >
                            Intra in admin
                        </Button>

                        {errorMessage && (
                            <div className={classes.errorText} aria-live="polite">
                                {errorMessage}
                            </div>
                        )}
                    </form>

                </Paper>

                <div className={classes.coverPanel}>
                    <Image
                        alt="Clinica pediatrica moderna Cardiopedi"
                        className={classes.coverImage}
                        fill
                        priority
                        src="/cardiopedi-login-cover.png"
                        sizes="(max-width: 900px) 100vw, 54vw"
                    />
                    <div className={classes.coverOverlay} />
                </div>
            </section>
        </div>
    );
}
