'use client';

import { authenticate } from '@/app/actions/auth';
import { useActionState } from 'react';
import Link from 'next/link';
import {
  Paper,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Anchor,
  Box,
} from '@mantine/core';
import classes from './Login.module.css';

export default function LoginView() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className={classes.wrapper}>
            <Paper className={classes.paper}>
                <Box mb={24}>
                    <h2 className={classes.title}>Log in</h2>
                    <p className={classes.subtitle}>
                        Need an account?{' '}
                        <Anchor component={Link} href="/signup" className={classes.link}>
                            Create an account
                        </Anchor>
                    </p>
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
                            label="Username or Email"
                            size="md"
                            classNames={{ label: classes.label, input: classes.input }}
                            withAsterisk={false}
                        />
                    </Box>

                    <Box mb={24}>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            label="Password"
                            size="md"
                            classNames={{ label: classes.label, innerInput: classes.input }}
                            withAsterisk={false}
                        />
                    </Box>

                    <Box mb={32}>
                        <Checkbox
                            id="remember-me"
                            name="remember-me"
                            label="Keep me logged in"
                            color="#007c89"
                            size="md"
                            styles={{ label: { color: '#241c15' } }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        loading={isPending}
                        className={classes.submitButton}
                    >
                        Log in
                    </Button>

                    {errorMessage && (
                        <div className={classes.errorText} aria-live="polite">
                            {errorMessage}
                        </div>
                    )}
                </form>
            </Paper>
        </div>
    );
}
