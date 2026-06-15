"use client";

import { SignUp } from "@clerk/nextjs";
import { readStoredDemoSignInEmail } from "@/lib/auth/demo-sign-in-email";
import { useEffect, useState } from "react";

type SignUpFormProps = {
  fallbackRedirectUrl: string;
  initialEmail?: string;
  signInUrl?: string;
};

export function SignUpForm({
  fallbackRedirectUrl,
  initialEmail = "",
  signInUrl = "/sign-in",
}: SignUpFormProps) {
  const [emailAddress, setEmailAddress] = useState(initialEmail.trim().toLowerCase());

  useEffect(() => {
    const stored = readStoredDemoSignInEmail();
    if (stored) {
      setEmailAddress(stored);
    }
  }, []);

  return (
    <SignUp
      key={emailAddress || "sign-up-empty"}
      fallbackRedirectUrl={fallbackRedirectUrl}
      signInUrl={signInUrl}
      initialValues={emailAddress ? { emailAddress } : undefined}
    />
  );
}
