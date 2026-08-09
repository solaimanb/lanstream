/**
 * Create server button — navigates to create form.
 */
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export function CreateServerButton() {
  return (
    <Link href="/servers/new" className={buttonVariants({ variant: "default", size: "sm" })}>
      New Server
    </Link>
  );
}
