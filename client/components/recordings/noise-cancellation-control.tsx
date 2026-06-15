"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type NoiseCancellationControlProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function NoiseCancellationControl({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: NoiseCancellationControlProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={id} className="text-foreground">
          Noise cancellation
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {checked
            ? "Web Audio API high-pass, compression, and adaptive noise gate."
            : "Off — captures the raw mic so you can hear the difference."}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
