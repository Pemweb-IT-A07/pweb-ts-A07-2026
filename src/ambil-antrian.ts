import { ensureSeedData, issueTicket, listQueueTypes, queueWaitingCount } from "./services/queue.service.js";
import type { PriorityLevel, QueueType } from "./types/index.js";
import { qs } from "./utils/dom.js";
import { formatTicketCode } from "./utils/format.js";

const POLL_INTERVAL_MS = 2500;
const PRIORITY_OPTIONS: PriorityLevel[] = ["Lansia", "Disabilitas", "VIP"];

ensureSeedData();

const panel = qs<HTMLDivElement>("#ambil-panel");
const resultSection = qs<HTMLElement>("#ticket-result");
const resultCode = qs<HTMLParagraphElement>("#ticket-result-code");
const resultDetail = qs<HTMLParagraphElement>("#ticket-result-detail");
const resultClose = qs<HTMLButtonElement>("#ticket-result-close");

function renderCard(type: QueueType): HTMLDivElement {
  const waitingCount = queueWaitingCount(type.code);

  const card = document.createElement("div");
  card.className = "ambil-card";
  card.innerHTML = `
    <div class="ambil-card-header">
      <h2>${type.name}</h2>
      <span>${type.code}</span>
    </div>
    <p>${waitingCount} menunggu</p>
    <button type="button" data-action="ambil" data-code="${type.code}" data-priority="Normal">Ambil Nomor</button>
    <details class="ambil-priority-options">
      <summary>Ambil dengan prioritas</summary>
      <div class="ambil-priority-buttons">
        ${PRIORITY_OPTIONS.map(
          (priority) =>
            `<button type="button" data-action="ambil" data-code="${type.code}" data-priority="${priority}">${priority}</button>`
        ).join("")}
      </div>
    </details>
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
  const priority = target.dataset["priority"] as PriorityLevel | undefined;
  if (action !== "ambil" || !code || !priority) return;

  const ticket = issueTicket(code, priority);
  if (!ticket) return;

  resultCode.textContent = formatTicketCode(ticket.queueCode, ticket.number);
  resultDetail.textContent = `Prioritas: ${ticket.priority}`;
  resultSection.hidden = false;
  render();
});

resultClose.addEventListener("click", () => {
  resultSection.hidden = true;
});

render();
setInterval(render, POLL_INTERVAL_MS);
