// src/components/ErrorBoundary.tsx
import React, { ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";
import ErrorScreen from "@/components/common/ErrorScreen";
import { Mascots } from "@/assets/maplebear";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught an error:", error);
  }

  render() {
    const errorMessage =
      this.state.error?.message ??
      "Ocorreu um erro inesperado. Tente novamente em instantes ou volte para o dashboard.";

    if (this.state.hasError) {
      return (
        <ErrorScreen
          eyebrow="Ops, algo deu errado"
          heading="Erro inesperado"
          description={errorMessage}
          primaryLabel="Ir para o Dashboard"
          primaryIcon={<Home className="w-4 h-4" />}
          onPrimary={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.href = "/dashboard";
          }}
          secondaryLabel="Voltar"
          secondaryIcon={<ArrowLeft className="w-4 h-4" />}
          onSecondary={() => {
            this.setState({ hasError: false, error: undefined });
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/dashboard";
            }
          }}
          attemptedPath={typeof window !== "undefined" ? window.location.pathname : undefined}
          mascot={Mascots.Thinking}
          mascotAlt="Mascote refletindo sobre o erro"
        />
      );
    }

    return this.props.children;
  }
}
