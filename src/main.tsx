import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global-campaign-2025.css";
import { seedKnowledgeBase } from "./lib/knowledgeBase";

seedKnowledgeBase().catch((error) => {
  console.warn("Falha ao semear base de conhecimento padrão:", error);
});

createRoot(document.getElementById("root")!).render(<App />);
