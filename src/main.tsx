import { createRoot } from "react-dom/client";
import App from "./App";
// import "./index.css"; // Removido para usar o CSS gerado pelo build do Tailwind
import "./styles/global-campaign-2025.css";

createRoot(document.getElementById("root")!).render(<App />);
