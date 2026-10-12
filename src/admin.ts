import { enforceAdmin, logout } from "./services/auth.service.js";
import {
  callTicket,
  completeTicket,
  createQueueType,
  deleteQueueType,
  ensureSeedData,
  issueTicket,
  listQueueTypes,
  listTicketsForQueue,
  queueWaitingCount,
  resetAllQueues,
  skipTicket,
  sortWaitingOrder,
  toggleQueueTypeActive,
} from "./services/queue.service.js";
import type { PriorityLevel, Ticket } from "./types/index.js";
import { qs } from "./utils/dom.js";
import { formatTicketCode } from "./utils/format.js";

ensureSeedData();
const session = enforceAdmin();

if (session) {
  const userNameEl = qs<HTMLSpanElement>("#user-name");
  const userRoleEl = qs<HTMLSpanElement>("#user-role");
  const resetBtn = qs<HTMLButtonElement>("#reset-queue-btn");
  const logoutBtn = qs<HTMLButtonElement>("#logout-btn");

  const queueTypeForm = qs<HTMLFormElement>("#queue-type-form");
  const queueCodeInput = qs<HTMLInputElement>("#queue-code");
  const queueNameInput = qs<HTMLInputElement>("#queue-name");
  const queueTypeError = qs<HTMLParagraphElement>("#queue-type-error");
  const queueTypeList = qs<HTMLUListElement>("#queue-type-list");

  const issueForm = qs<HTMLFormElement>("#issue-ticket-form");
  const issueQueueSelect = qs<HTMLSelectElement>("#issue-queue-select");
  const issuePrioritySelect = qs<HTMLSelectElement>("#issue-priority-select");
  const issueError = qs<HTMLParagraphElement>("#issue-ticket-error");
  const ticketGroups = qs<HTMLDivElement>("#ticket-groups");

  userNameEl.textContent = session.firstName;
  userRoleEl.textContent = session.role;

  function renderAll(): void {
    renderQueueTypeList();
    renderIssueSelect();
    renderTicketGroups();
  }

  function renderQueueTypeList(): void {
    const types = listQueueTypes();
    queueTypeList.innerHTML = "";

    for (const type of types) {
      const waiting = queueWaitingCount(type.code);
      const li = document.createElement("li");
      li.className = "queue-type-item";
      li.innerHTML = `
        <div class="queue-type-info">
          <strong>${type.name} (${type.code})</strong>
          <span>${waiting} menunggu</span>
          <span>${type.active ? "Aktif" : "Nonaktif"}</span>
        </div>
        <div class="queue-type-actions">
          <button type="button" data-action="toggle" data-code="${type.code}">
            ${type.active ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button type="button" data-action="delete" data-code="${type.code}">Hapus</button>
        </div>
      `;
      queueTypeList.appendChild(li);
    }
  }

  function renderIssueSelect(): void {
    const activeTypes = listQueueTypes().filter((t) => t.active);
    const currentValue = issueQueueSelect.value;

    issueQueueSelect.innerHTML = '<option value="">Pilih jenis antrian</option>';
    for (const type of activeTypes) {
      const option = document.createElement("option");
      option.value = type.code;
      option.textContent = `${type.name} (${type.code})`;
      issueQueueSelect.appendChild(option);
    }
    issueQueueSelect.value = currentValue;
  }

  function orderTicketsForDisplay(tickets: Ticket[]): Ticket[] {
    const called = tickets.filter((t) => t.status === "Dipanggil");
    const waiting = sortWaitingOrder(tickets.filter((t) => t.status === "Menunggu"));
    const done = tickets
      .filter((t) => t.status === "Selesai" || t.status === "Dilewati")
      .sort((a, b) => b.createdAt - a.createdAt);
    return [...called, ...waiting, ...done];
  }

  function renderTicketRow(ticket: Ticket): HTMLDivElement {
    const row = document.createElement("div");
    const statusClass = ticket.status.toLowerCase();
    const priorityClass = ticket.priority.toLowerCase();
    row.className = `ticket-row ticket-row-${statusClass}`;

    let actionsHtml = "";
    if (ticket.status === "Menunggu") {
      actionsHtml = `
        <button type="button" data-action="call" data-ticket-id="${ticket.id}">Panggil</button>
        <button type="button" data-action="skip" data-ticket-id="${ticket.id}">Lewati</button>
      `;
    } else if (ticket.status === "Dipanggil") {
      actionsHtml = `<button type="button" data-action="complete" data-ticket-id="${ticket.id}">Selesai</button>`;
    }

    row.innerHTML = `
      <span class="ticket-number">${formatTicketCode(ticket.queueCode, ticket.number)}</span>
      <span class="ticket-priority ticket-priority-${priorityClass}">${ticket.priority}</span>
      <span class="ticket-status ticket-status-${statusClass}">${ticket.status}</span>
      <span class="ticket-actions">${actionsHtml}</span>
    `;
    return row;
  }

  function renderTicketGroups(): void {
    const types = listQueueTypes();
    ticketGroups.innerHTML = "";

    for (const type of types) {
      const ordered = orderTicketsForDisplay(listTicketsForQueue(type.code));

      const group = document.createElement("div");
      group.className = "ticket-group";

      const heading = document.createElement("h3");
      heading.textContent = `${type.name} (${type.code})`;
      group.appendChild(heading);

      if (ordered.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Belum ada tiket.";
        group.appendChild(empty);
      } else {
        for (const ticket of ordered) {
          group.appendChild(renderTicketRow(ticket));
        }
      }

      ticketGroups.appendChild(group);
    }
  }

  queueTypeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = createQueueType(queueCodeInput.value, queueNameInput.value);
    if (!result.ok) {
      queueTypeError.textContent = result.message;
      queueTypeError.hidden = false;
      return;
    }
    queueTypeError.hidden = true;
    queueTypeForm.reset();
    renderAll();
  });

  issueForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = issueQueueSelect.value;
    const priority = issuePrioritySelect.value as PriorityLevel;

    if (!code) {
      issueError.textContent = "Pilih jenis antrian terlebih dahulu.";
      issueError.hidden = false;
      return;
    }

    const ticket = issueTicket(code, priority);
    if (!ticket) {
      issueError.textContent = "Jenis antrian tidak aktif atau tidak ditemukan.";
      issueError.hidden = false;
      return;
    }

    issueError.hidden = true;
    renderAll();
  });

  queueTypeList.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset["action"];
    const code = target.dataset["code"];
    if (!action || !code) return;

    if (action === "toggle") toggleQueueTypeActive(code);
    if (action === "delete") {
      const confirmed = window.confirm("Hapus jenis antrian ini beserta seluruh tiketnya?");
      if (!confirmed) return;
      deleteQueueType(code);
    }
    renderAll();
  });

  ticketGroups.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset["action"];
    const ticketId = target.dataset["ticketId"];
    if (!action || !ticketId) return;

    if (action === "call") callTicket(ticketId);
    if (action === "complete") completeTicket(ticketId);
    if (action === "skip") skipTicket(ticketId);
    renderAll();
  });

  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Reset seluruh antrian? Semua tiket akan dihapus.");
    if (!confirmed) return;
    resetAllQueues();
    renderAll();
  });

  logoutBtn.addEventListener("click", () => logout());

  renderAll();
}
