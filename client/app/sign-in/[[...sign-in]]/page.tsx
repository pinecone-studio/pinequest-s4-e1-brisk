import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
  DEMO_SIGN_IN_EMAIL_COOKIE,
  resolveDemoSignInEmail,
} from "@/lib/auth/demo-sign-in-email";
import { resolveAppEntryPath } from "@/lib/server/resolve-app-entry-path";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();
  const entryPath = userId ? await resolveAppEntryPath() : "/home";
  if (userId) redirect(entryPath);

  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get(DEMO_SIGN_IN_EMAIL_COOKIE)?.value;
  const initialEmail = resolveDemoSignInEmail(
    cookieEmail ? decodeURIComponent(cookieEmail) : null,
  );

  return (
    <AuthShell variant="plain">
      <SignInForm fallbackRedirectUrl={entryPath} initialEmail={initialEmail} />
    </AuthShell>
  );
}
