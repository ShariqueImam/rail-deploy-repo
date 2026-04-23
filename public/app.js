const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const isLocalDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const apiBaseUrl =
  isLocalDevHost && window.location.port !== "3000"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "";

function createTable(headers, rows, emptyLabel) {
  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";

  if (!rows.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = emptyLabel;
    wrapper.appendChild(emptyState);
    return wrapper;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  return wrapper;
}

function createSectionCard(titleText, badgeText, tableElement) {
  const card = document.createElement("article");
  card.className = "card";

  const headingRow = document.createElement("div");
  headingRow.className = "heading-row";

  const title = document.createElement("h2");
  title.textContent = titleText;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = badgeText;

  headingRow.appendChild(title);
  headingRow.appendChild(badge);
  card.appendChild(headingRow);
  card.appendChild(tableElement);

  return card;
}

function renderData(payload) {
  const usersRows = (payload.users || []).map((user) => [user.username]);
  const accountsRows = (payload.accounts || []).map((account) => [
    account.username,
    account.server,
    account.balance,
  ]);

  const usersTable = createTable(
    ["Username"],
    usersRows,
    "No user records found."
  );
  const usersCard = createSectionCard(
    "Users",
    `${usersRows.length} records`,
    usersTable
  );

  const accountsTable = createTable(
    ["Username", "Server", "Balance"],
    accountsRows,
    "No account records found."
  );
  const accountsCard = createSectionCard(
    "Accounts",
    `${accountsRows.length} records`,
    accountsTable
  );

  resultsEl.appendChild(usersCard);
  resultsEl.appendChild(accountsCard);
}

async function loadData() {
  statusEl.textContent = "Loading...";
  resultsEl.innerHTML = "";

  try {
    const response = await fetch(`${apiBaseUrl}/api/data`);
    const contentType = response.headers.get("content-type") || "";
    let payload;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(
        `Expected JSON but received non-JSON response: ${rawText.slice(0, 120)}`
      );
    }

    if (!response.ok) {
      throw new Error(payload.details || payload.error || "Unknown error");
    }

    statusEl.textContent = `Connected to database: ${payload.databaseName}`;
    renderData(payload);
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  }
}

loadBtn.addEventListener("click", loadData);
