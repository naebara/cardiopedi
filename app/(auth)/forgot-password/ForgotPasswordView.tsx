"use client";

import { requestPasswordReset, type ForgotPasswordState } from "@/app/actions/auth";
import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeartPulse } from "lucide-react";
import { Box, Button, Paper, TextInput } from "@mantine/core";
import classes from "../login/Login.module.css";

const initialState: ForgotPasswordState = {
  message: "",
  status: "idle",
};

export default function ForgotPasswordView() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

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
            <p className={classes.eyebrow}>Resetare parola</p>
            <h2 className={classes.title}>Ai uitat parola?</h2>
            <p className={classes.subtitle}>Introdu emailul contului si vei primi o parola temporara.</p>
          </Box>

          <form action={formAction}>
            <Box mb={24}>
              <TextInput
                autoComplete="email"
                classNames={{ input: classes.input, label: classes.label }}
                id="email"
                label="Email"
                name="email"
                required
                size="md"
                type="email"
                withAsterisk={false}
              />
            </Box>

            <Button className={classes.submitButton} fullWidth loading={isPending} type="submit">
              Trimite parola temporara
            </Button>

            {state.message ? (
              <div className={state.status === "success" ? classes.successText : classes.errorText} aria-live="polite">
                {state.message}
              </div>
            ) : null}
          </form>

          <p className={classes.accountNote}>
            <Link className={classes.link} href="/login">
              Inapoi la autentificare
            </Link>
          </p>
        </Paper>

        <div className={classes.coverPanel}>
          <Image
            alt="Cabinet modern de cardiologie pediatrica"
            className={classes.coverImage}
            fill
            priority
            src="/cardiopedi-clinic-hero.png"
            sizes="(max-width: 900px) 100vw, 54vw"
          />
          <div className={classes.coverOverlay} />
        </div>
      </section>
    </div>
  );
}
