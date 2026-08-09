import Link from "next/link";
import { SignInForm } from "./_components/sign-in-form";

export default function SignInPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <p className="mt-2 text-sm text-muted-foreground">Welcome back to LANStream.</p>

      <div className="mt-6">
        <SignInForm />
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-foreground underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
