import { ensureSeedData, getCalledTicket, listQueueTypes, queueWaitingCount } from "./services/queue.service.js";
import type { QueueType, Ticket } from "./types/index.js";
import { qs } from "./utils/dom.js";
import { formatTicketCode, formatTime } from "./utils/format.js";

const POLL_INTERVAL_MS = 2500;

ensureSeedData();

const panel = qs<HTMLDivElement>("#layar-panel");
const lastUpdated = qs<HTMLParagraphElement>("#last-updated");
const fullscreenBtn = qs<HTMLButtonElement>("#fullscreen-btn");

const lastAnnouncedTicket = new Map<string, string>();
const announcementSound = new Audio("audio/panggilan.mp3");

function announceIfNeeded(type: QueueType, called: Ticket | undefined): void {
  if (!called) return;
  if (lastAnnouncedTicket.get(type.code) === called.id) return;
  lastAnnouncedTicket.set(type.code, called.id);

  announcementSound.currentTime = 0;
  announcementSound.play().catch(() => {
    /* abaikan bila browser menolak autoplay sebelum ada interaksi pengguna */
  });
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
  panel.replaceChildren();

  if (activeTypes.length === 0) {
    panel.innerHTML = '<p class="layar-no-queues">Belum ada jenis antrian yang aktif.</p>';
    lastUpdated.textContent = `Diperbarui ${formatTime(Date.now())}`;
    return;
  }

  for (const type of activeTypes) {
    announceIfNeeded(type, getCalledTicket(type.code));
    panel.appendChild(renderCard(type));
  }

  lastUpdated.textContent = `Diperbarui ${formatTime(Date.now())}`;
}

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
