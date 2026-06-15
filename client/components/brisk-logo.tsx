import { cn } from "@/lib/utils";
import { Grand_Hotel } from "next/font/google";
import Link from "next/link";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

type BriskLogoProps = {
  className?: string;
};

export function BriskLogo({ className }: BriskLogoProps) {
  return (
    <Link
      href="/home"
      aria-label="Go to home"
      className={cn(
        grandHotel.className,
        "text-3xl text-foreground transition-opacity hover:opacity-80",
        className,
      )}
    >
      Brisk
    </Link>
  );
}
