import { enforceLogin, logout } from "./services/auth.service.js";
import {
  callNextInQueue,
  completeTicket,
  ensureSeedData,
  getCalledTicket,
  getNextWaitingTicket,
  listQueueTypes,
  queueWaitingCount,
  skipTicket,
} from "./services/queue.service.js";
import type { QueueType } from "./types/index.js";
import { qs } from "./utils/dom.js";
import { formatTicketCode } from "./utils/format.js";

ensureSeedData();
const session = enforceLogin();

if (session) {
  const logoutBtn = qs<HTMLButtonElement>("#logout-btn");
  const panel = qs<HTMLDivElement>("#operator-panel");

  logoutBtn.addEventListener("click", () => logout());

  function renderCard(type: QueueType): HTMLDivElement {
    const called = getCalledTicket(type.code);
    const next = getNextWaitingTicket(type.code);
    const waitingCount = queueWaitingCount(type.code);

    const card = document.createElement("div");
    card.className = "operator-card";
    card.innerHTML = `
      <div class="operator-card-header">
        <h2>${type.name}</h2>
        <span>${waitingCount} menunggu</span>
      </div>
      <div class="operator-card-body">
        <div class="operator-current">
          <span>SEDANG DIPANGGIL</span>
          <strong>${called ? formatTicketCode(called.queueCode, called.number) : "-"}</strong>
        </div>
        <div class="operator-next">
          <span>BERIKUTNYA</span>
          <strong>${next ? formatTicketCode(next.queueCode, next.number) : "-"}</strong>
          ${next ? `<small>Prioritas ${next.priority}</small>` : ""}
        </div>
      </div>
      <div class="operator-card-actions">
        <button type="button" data-action="next" data-code="${type.code}" ${next ? "" : "disabled"}>Panggil Berikutnya</button>
        <button type="button" data-action="skip" data-code="${type.code}" ${called ? "" : "disabled"}>Lewati</button>
        <button type="button" data-action="complete" data-code="${type.code}" ${called ? "" : "disabled"}>Selesai</button>
      </div>
      ${
        waitingCount === 0 && !called
          ? '<p class="operator-empty">Tidak ada tiket menunggu untuk jenis antrian ini.</p>'
          : ""
      }
    `;
    return card;
  }

  function render(): void {
    const activeTypes = listQueueTypes().filter((t) => t.active);
    panel.innerHTML = "";
    for (const type of activeTypes) {
      panel.appendChild(renderCard(type));
    }
  }

  panel.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset["action"];
    const code = target.dataset["code"];
    if (!action || !code) return;

    if (action === "next") {
      callNextInQueue(code);
    } else if (action === "skip") {
      const called = getCalledTicket(code);
      if (called) skipTicket(called.id);
    } else if (action === "complete") {
      const called = getCalledTicket(code);
      if (called) completeTicket(called.id);
    }
    render();
  });

  render();
}
