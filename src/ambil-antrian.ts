import { ensureSeedData, issueTicket, listQueueTypes, queueWaitingCount } from "./services/queue.service.js";
import { enforceLogin, logout } from "./services/auth.service.js";
import { getSession } from "./services/storage.service.js";
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
const logoutButton = qs<HTMLButtonElement>("#ambil-logout-btn");

if (getSession()) {
  logoutButton.hidden = false;
  logoutButton.addEventListener("click", logout);
}

function renderCard(type: QueueType, priorityOptionsOpen: boolean): HTMLDivElement {
  const waitingCount = queueWaitingCount(type.code);

  const card = document.createElement("div");
  card.className = "ambil-card";
  card.dataset["code"] = type.code;
  card.dataset["name"] = type.name;
  card.innerHTML = `
    <div class="ambil-card-header">
      <h2>${type.name}</h2>
      <span>${type.code}</span>
    </div>
    <p><span data-waiting-count>${waitingCount}</span> menunggu</p>
    <button type="button" data-action="ambil" data-code="${type.code}" data-priority="Normal">Ambil Nomor</button>
    <details class="ambil-priority-options" data-code="${type.code}" ${priorityOptionsOpen ? "open" : ""}>
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
  const cards = Array.from(panel.querySelectorAll<HTMLDivElement>(".ambil-card"));
  const cardsMatch =
    activeTypes.length === cards.length &&
    activeTypes.every((type, index) => {
      const card = cards[index];
      return card !== undefined && card.dataset["code"] === type.code && card.dataset["name"] === type.name;
    });

  if (!cardsMatch) {
    const openPriorityCodes = new Set(
      Array.from(panel.querySelectorAll<HTMLDetailsElement>(".ambil-priority-options[open]"))
        .map((details) => details.dataset["code"])
        .filter((code): code is string => code !== undefined)
    );
    panel.innerHTML = "";
    for (const type of activeTypes) {
      panel.appendChild(renderCard(type, openPriorityCodes.has(type.code)));
    }
    return;
  }

  activeTypes.forEach((type, index) => {
    const card = cards[index];
    const count = card?.querySelector<HTMLElement>("[data-waiting-count]");
    if (count) count.textContent = String(queueWaitingCount(type.code));
  });
}

function closePriorityOptions(except?: HTMLDetailsElement): void {
  for (const details of panel.querySelectorAll<HTMLDetailsElement>(".ambil-priority-options[open]")) {
    if (details !== except) details.open = false;
  }
}

document.addEventListener("click", (event) => {
  const target = event.target;
  const clickedOptions = target instanceof Element
    ? target.closest<HTMLDetailsElement>(".ambil-priority-options") ?? undefined
    : undefined;
  closePriorityOptions(clickedOptions);
});

panel.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const action = target.dataset["action"];
  const code = target.dataset["code"];
  const priority = target.dataset["priority"] as PriorityLevel | undefined;
  if (action !== "ambil" || !code || !priority) return;

  if (!enforceLogin()) return;

  closePriorityOptions();
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
