"use client";

import { SignIn } from "@clerk/nextjs";
import { readStoredDemoSignInEmail } from "@/lib/auth/demo-sign-in-email";
import { useEffect, useState } from "react";

type SignInFormProps = {
  fallbackRedirectUrl: string;
  initialEmail?: string;
  signUpUrl?: string;
};

export function SignInForm({
  fallbackRedirectUrl,
  initialEmail = "",
  signUpUrl = "/sign-up",
}: SignInFormProps) {
  const [emailAddress, setEmailAddress] = useState(initialEmail.trim().toLowerCase());

  useEffect(() => {
    const stored = readStoredDemoSignInEmail();
    if (stored) {
      setEmailAddress(stored);
    }
  }, []);

  return (
    <SignIn
      key={emailAddress || "sign-in-empty"}
      fallbackRedirectUrl={fallbackRedirectUrl}
      signUpUrl={signUpUrl}
      initialValues={emailAddress ? { emailAddress } : undefined}
    />
  );
}
