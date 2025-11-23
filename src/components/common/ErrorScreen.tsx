import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";
import { Mascots } from "@/assets/maplebear";

interface ErrorScreenProps {
  eyebrow?: string;
  heading: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryIcon?: ReactNode;
  attemptedPath?: string;
  mascot?: string;
  mascotAlt?: string;
}

const ErrorScreen = ({
  eyebrow = "Ops, algo deu errado",
  heading,
  description,
  primaryLabel,
  onPrimary,
  primaryIcon,
  secondaryLabel,
  onSecondary,
  secondaryIcon,
  attemptedPath,
  mascot = Mascots.Peeking,
  mascotAlt = "Mascote do Maple Bear",
}: ErrorScreenProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          <Mascot
            src={mascot}
            size="lg"
            alt={mascotAlt}
            className="hidden lg:block"
          />
          <div className="space-y-3">
            {eyebrow && (
              <p className="text-sm uppercase tracking-wide text-primary font-semibold">
                {eyebrow}
              </p>
            )}
            <h1 className="text-5xl font-bold text-foreground">{heading}</h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              {description}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center lg:justify-start pt-2">
            <Button onClick={onPrimary} size="lg" className="gap-2">
              {primaryIcon}
              {primaryLabel}
            </Button>
            {secondaryLabel && onSecondary ? (
              <Button
                onClick={onSecondary}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {secondaryIcon}
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
          {attemptedPath ? (
            <p className="text-sm text-muted-foreground">
              Caminho tentado:{" "}
              <code className="bg-muted px-2 py-1 rounded">
                {attemptedPath}
              </code>
            </p>
          ) : null}
        </div>

        <div className="flex justify-center lg:justify-end">
          <Mascot
            src={mascot}
            size="xl"
            alt={mascotAlt}
            className="drop-shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;
