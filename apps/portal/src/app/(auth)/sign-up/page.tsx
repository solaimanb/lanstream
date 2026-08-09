import Link from "next/link";
import { SignUpForm } from "./_components/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your LANStream account.
      </p>

      <div className="mt-6">
        <SignUpForm />
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
