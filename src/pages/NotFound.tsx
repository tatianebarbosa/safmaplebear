import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import ErrorScreen from "@/components/common/ErrorScreen";
import { Mascots } from "@/assets/maplebear";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log landing on an unknown route (could be hooked to analytics)
    void location.pathname;
  }, [location.pathname]);

  return (
    <ErrorScreen
      eyebrow="Ops, não encontramos essa rota"
      heading="404"
      description="Nosso mascote tentou achar essa página, mas ela não existe mais. Volte para o painel ou escolha outro caminho."
      primaryLabel="Ir para o Dashboard"
      primaryIcon={<Home className="w-4 h-4" />}
      onPrimary={() => navigate("/dashboard")}
      secondaryLabel="Voltar"
      secondaryIcon={<ArrowLeft className="w-4 h-4" />}
      onSecondary={() => navigate(-1)}
      attemptedPath={location.pathname}
      mascot={Mascots.Peeking}
      mascotAlt="Mascote indicando erro"
    />
  );
};

export default NotFound;
