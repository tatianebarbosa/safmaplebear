import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/global-campaign-2025.css";
import { seedKnowledgeBase } from "./lib/knowledgeBase";

seedKnowledgeBase().catch((error) => {
  // Falha silenciosa ao semear base de conhecimento padrão
  const message = error instanceof Error ? error.message : "Erro desconhecido";
});

createRoot(document.getElementById("root")!).render(<App />);
