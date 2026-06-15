import { AuthShell } from "@/components/auth/auth-shell";
import { SignIn } from "@clerk/nextjs";
import { resolveAppEntryPath } from "@/lib/server/resolve-app-entry-path";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();
  const entryPath = userId ? await resolveAppEntryPath() : "/home";
  if (userId) redirect(entryPath);

  return (
    <AuthShell variant="plain">
      <SignIn fallbackRedirectUrl={entryPath} signUpUrl="/sign-up" />
    </AuthShell>
  );
}
