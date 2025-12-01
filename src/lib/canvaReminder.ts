const CANVA_PEOPLE_URL = "https://www.canva.com/settings/people";
const CANVA_DASHBOARD_PATH = "/dashboard/canva";
const MODAL_ID = "canva-sync-reminder-modal";

/**
 * Exibe um aviso modal centralizado lembrando de replicar a alterao no Canva.
 * Abre imediatamente a pgina oficial em uma nova guia e exibe botes de ao.
 */
export const showCanvaSyncReminder = () => {
  if (typeof document === "undefined") return;

  // Remove modal anterior, se existir
  const existing = document.getElementById(MODAL_ID);
  if (existing?.parentNode) existing.parentNode.removeChild(existing);

  // Cria modal
  const wrapper = document.createElement("div");
  wrapper.id = MODAL_ID;
  wrapper.setAttribute("role", "alertdialog");
  wrapper.setAttribute("aria-modal", "true");
  wrapper.style.position = "fixed";
  wrapper.style.inset = "0";
  wrapper.style.zIndex = "99999";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.background = "rgba(0,0,0,0.45)";
  wrapper.style.backdropFilter = "blur(2px)";
  wrapper.style.padding = "18px";

  wrapper.innerHTML = `
    <div style="
      background: #fff;
      color: #0f172a;
      width: min(92vw, 760px);
      border-radius: 18px;
      box-shadow: 0 18px 60px rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(15, 23, 42, 0.08);
      padding: 22px 24px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    ">
      <div style="display: flex; gap: 14px; align-items: flex-start;">
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fef2f2;
          color: #b91c1c;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          border: 1px solid #fecaca;
        ">!</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px; line-height: 1.2;">
            Replique esta alterao no Canva agora
          </div>
          <div style="font-size: 15px; color: #475569; line-height: 1.4;">
            Finalize esta mesma ao diretamente no Canva para manter licen?as e usu?rios alinhados.
          </div>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
        <button data-canva-close style="
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
          min-width: 110px;
        ">Ok, vou ajustar</button>
        <button data-canva-open style="
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          min-width: 130px;
          box-shadow: 0 12px 28px rgba(239, 68, 68, 0.28);
        ">Abrir Canva</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
    document.removeEventListener("keydown", onEsc);
  };

  const onEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };

  wrapper.addEventListener("click", (event) => {
    if (event.target === wrapper) {
      closeModal();
    }
  });

  const closeButton = wrapper.querySelector<HTMLButtonElement>("[data-canva-close]");
  closeButton?.addEventListener("click", () => {
    closeModal();
    // Volta para o painel de escolas/licen?as aps o usu?rio confirmar que vai ajustar.
    window.location.href = CANVA_DASHBOARD_PATH;
  });

  const openButton = wrapper.querySelector<HTMLButtonElement>("[data-canva-open]");
  openButton?.addEventListener("click", () => {
    window.open(CANVA_PEOPLE_URL, "_blank", "noopener,noreferrer");
    closeModal();
  });

  document.addEventListener("keydown", onEsc);
  document.body.appendChild(wrapper);

  // Abre a nova guia imediatamente aps a ao do usu?rio
  window.open(CANVA_PEOPLE_URL, "_blank", "noopener,noreferrer");
};
