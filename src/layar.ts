import { ensureSeedData, getCalledTicket, listQueueTypes, queueWaitingCount } from "./services/queue.service.js";
import type { QueueType, Ticket } from "./types/index.js";
import { qs } from "./utils/dom.js";
import { formatTicketCode, formatTime } from "./utils/format.js";

const POLL_INTERVAL_MS = 2500;

ensureSeedData();

const tabs = qs<HTMLDivElement>("#layar-tabs");
const panel = qs<HTMLDivElement>("#layar-panel");
const lastUpdated = qs<HTMLParagraphElement>("#last-updated");
const fullscreenBtn = qs<HTMLButtonElement>("#fullscreen-btn");

const lastAnnouncedTicket = new Map<string, string>();
let selectedQueueCode = "";

function announceIfNeeded(type: QueueType, called: Ticket | undefined): void {
  if (!called) return;
  if (lastAnnouncedTicket.get(type.code) === called.id) return;
  lastAnnouncedTicket.set(type.code, called.id);

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(
      `Nomor antrian ${formatTicketCode(called.queueCode, called.number)}, silakan menuju loket ${type.name}`
    );
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  }
}

function renderCard(type: QueueType): HTMLDivElement {
  const called = getCalledTicket(type.code);
  const waitingCount = queueWaitingCount(type.code);

  const card = document.createElement("div");
  card.className = "layar-card";
  card.innerHTML = `
    <div class="layar-card-header">
      <h2>${type.name}</h2>
      <span>${type.code}</span>
    </div>
    <div class="layar-card-body">
      ${
        called
          ? `<span class="layar-status">DIPANGGIL</span><strong class="layar-number">${formatTicketCode(called.queueCode, called.number)}</strong>`
          : `<p class="layar-empty">Belum ada nomor dipanggil. Nomor akan muncul setelah operator memanggil tiket.</p>`
      }
    </div>
    <div class="layar-card-footer">
      <span>${waitingCount} tiket menunggu</span>
    </div>
  `;
  return card;
}

function render(): void {
  const activeTypes = listQueueTypes().filter((t) => t.active);
  const focusedTab = document.activeElement instanceof HTMLButtonElement &&
    document.activeElement.classList.contains("layar-tab")
    ? document.activeElement.dataset["queueCode"]
    : undefined;

  tabs.replaceChildren();
  panel.replaceChildren();

  if (activeTypes.length === 0) {
    selectedQueueCode = "";
    panel.innerHTML = '<p class="layar-no-queues">Belum ada jenis antrian yang aktif.</p>';
    panel.removeAttribute("aria-labelledby");
    lastUpdated.textContent = `Diperbarui ${formatTime(Date.now())}`;
    return;
  }

  const firstType = activeTypes[0];
  if (!firstType) return;

  if (!activeTypes.some((type) => type.code === selectedQueueCode)) {
    selectedQueueCode = firstType.code;
  }

  for (const type of activeTypes) {
    announceIfNeeded(type, getCalledTicket(type.code));

    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `layar-tab-${type.code}`;
    tab.className = "layar-tab";
    tab.dataset["queueCode"] = type.code;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "layar-panel");
    tab.setAttribute("aria-selected", String(type.code === selectedQueueCode));
    tab.tabIndex = type.code === selectedQueueCode ? 0 : -1;
    tab.textContent = `${type.name} (${type.code})`;
    tabs.appendChild(tab);
  }

  const selectedType = activeTypes.find((type) => type.code === selectedQueueCode);
  if (selectedType) {
    panel.setAttribute("aria-labelledby", `layar-tab-${selectedType.code}`);
    panel.appendChild(renderCard(selectedType));
  }

  if (focusedTab) {
    const tabToFocus = Array.from(tabs.querySelectorAll<HTMLButtonElement>(".layar-tab"))
      .find((tab) => tab.dataset["queueCode"] === focusedTab);
    tabToFocus?.focus();
  }

  lastUpdated.textContent = `Diperbarui ${formatTime(Date.now())}`;
}

tabs.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const tab = event.target.closest<HTMLButtonElement>('[role="tab"]');
  if (!tab || !tabs.contains(tab)) return;

  selectedQueueCode = tab.dataset["queueCode"] ?? "";
  render();
});

tabs.addEventListener("keydown", (event) => {
  if (!(event.target instanceof HTMLButtonElement) || !event.target.classList.contains("layar-tab")) return;

  const availableTabs = Array.from(tabs.querySelectorAll<HTMLButtonElement>(".layar-tab"));
  const currentIndex = availableTabs.indexOf(event.target);
  if (currentIndex < 0 || availableTabs.length === 0) return;
  let nextIndex = currentIndex;

  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % availableTabs.length;
  else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = availableTabs.length - 1;
  else return;

  const nextTab = availableTabs[nextIndex];
  if (!nextTab) return;

  event.preventDefault();
  selectedQueueCode = nextTab.dataset["queueCode"] ?? "";
  render();
  Array.from(tabs.querySelectorAll<HTMLButtonElement>(".layar-tab"))
    .find((tab) => tab.dataset["queueCode"] === selectedQueueCode)
    ?.focus();
});

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      /* abaikan bila browser menolak permintaan fullscreen */
    });
  } else {
    document.exitFullscreen().catch(() => {
      /* abaikan */
    });
  }
});

render();
setInterval(render, POLL_INTERVAL_MS);
