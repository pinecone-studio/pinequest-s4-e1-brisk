import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

type CircleBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function CircleBackLink({ href, label, className }: CircleBackLinkProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={className ?? "rounded-full"}
      render={<Link href={href} />}
      aria-label={label}
    >
      <ArrowLeftIcon className="size-4" />
    </Button>
  );
}
