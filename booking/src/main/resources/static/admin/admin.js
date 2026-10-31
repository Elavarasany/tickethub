
const API = "/api/admin/tables";

let allRecords = [];
let currentTable = "events";
let currentColumns = [];
let sortDirections = {};

// ======================================
// READ API RESPONSE
// ======================================

async function readResponse(response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

// ======================================
// SHOW MESSAGE
// ======================================

function showMessage(message, type) {
    const element = document.getElementById("message");

    if (!element) return;

    element.textContent = message;
    element.className = type || "";
}

// ======================================
// DATE CONVERSION
// ======================================

// Display YYYY-MM-DD as DD/MM/YYYY
function formatDateForDisplay(value) {
    if (!value) return "";

    const text = String(value).trim().split("T")[0];

    const databaseMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (databaseMatch) {
        return `${databaseMatch[3]}/${databaseMatch[2]}/${databaseMatch[1]}`;
    }

    const displayMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (displayMatch) {
        return text;
    }

    return text;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for the API
function convertDateToDatabase(value) {
    if (!value) return value;

    const text = String(value).trim();

    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        throw new Error("Enter date in DD/MM/YYYY format. Example: 05/11/2026");
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        throw new Error("Enter a valid calendar date.");
    }

    return `${match[3]}-${match[2]}-${match[1]}`;
}

// ======================================
// TIME CONVERSION
// ======================================

function formatTimeForDisplay(value) {
    if (!value) return "";

    const text = String(value).trim();

    const ampmMatch = text.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (ampmMatch) {
        return `${ampmMatch[1].padStart(2, "0")}:${ampmMatch[2]} ${ampmMatch[3].toUpperCase()}`;
    }

    const match = text.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return text;

    let hours = Number(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

function convertTimeToDatabase(value) {
    if (!value) return value;

    const match = String(value).trim().match(
        /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i
    );

    if (!match) {
        throw new Error("Enter time in AM/PM format. Example: 10:30 AM");
    }

    const hours = Number(match[1]);

    if (hours < 1 || hours > 12) {
        throw new Error("Invalid hour. Use 1 to 12.");
    }

    return `${String(hours).padStart(2, "0")}:${match[2]} ${match[3].toUpperCase()}`;
}

// ======================================
// LOAD DATABASE TABLE
// ======================================

async function loadTable(tableName) {
    currentTable = tableName;

    const title = document.getElementById("tableTitle");
    const count = document.getElementById("recordCount");
    const tbody = document.getElementById("tableBody");

    title.textContent = tableName.replace("_", " ").toUpperCase();
    count.textContent = "Loading records...";
    tbody.innerHTML = "<tr><td>Loading records...</td></tr>";

    closeAddRecordForm();

    document.querySelectorAll(".table-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.table === tableName
        );
    });

    document.getElementById("seatGenerator").style.display =
        tableName === "seats" ? "block" : "none";

    try {
        const response = await fetch(`${API}/${tableName}/records`);
        const records = await readResponse(response);

        if (!response.ok) {
            throw new Error(records.message || "Unable to load records");
        }

        if (!Array.isArray(records)) {
            throw new Error("Invalid records response");
        }

        sortDirections = {};

        renderTable(records);

        count.textContent = `${records.length} records found`;

        if (records.length === 0) {
            showMessage("No records found.", "success");
        } else {
            showMessage("", "");
        }

    } catch (error) {
        count.textContent = "Error loading records";

        tbody.innerHTML = `
            <tr>
                <td colspan="100">${escapeHTML(error.message)}</td>
            </tr>
        `;

        showMessage(error.message, "error");
    }
}

// ======================================
// HTML ESCAPING
// ======================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ======================================
// CHECK COLUMN TYPES
// ======================================

function isDateColumn(column) {
    const name = column.toLowerCase();

    return (
        name === "date" ||
        name.endsWith("_date") ||
        name.includes("eventdate") ||
        name.includes("bookingdate") ||
        name.includes("createdat") ||
        name.includes("updatedat")
    );
}

function isTimeColumn(column) {
    return column.toLowerCase().includes("time");
}

// ======================================
// DISPLAY DATABASE RECORDS
// ======================================

function renderTable(records) {
    allRecords = records || [];

    const head = document.getElementById("tableHead");
    const body = document.getElementById("tableBody");

    head.innerHTML = "";
    body.innerHTML = "";

    if (allRecords.length === 0) {
        currentColumns = [];

        body.innerHTML = `
            <tr>
                <td colspan="10">No records found</td>
            </tr>
        `;
        return;
    }

    currentColumns = Object.keys(allRecords[0]);

    currentColumns.forEach((column, index) => {
        const th = document.createElement("th");

        th.innerHTML = `
            <div class="column-heading">
                <span>${escapeHTML(column)}</span>

                <div class="column-actions">
                    <button
                        type="button"
                        class="column-search-btn"
                        title="Search this column"
                    >⌕</button>

                    <button
                        type="button"
                        class="column-sort-btn"
                        title="Sort this column"
                    >↕</button>
                </div>
            </div>

            <input
                type="text"
                class="column-filter"
                placeholder="Search ${escapeHTML(column)}"
                hidden
            >
        `;

        const searchBtn = th.querySelector(".column-search-btn");
        const sortBtn = th.querySelector(".column-sort-btn");
        const filterInput = th.querySelector(".column-filter");

        searchBtn.addEventListener("click", () => {
            filterInput.hidden = !filterInput.hidden;

            if (!filterInput.hidden) {
                filterInput.focus();
            } else {
                filterInput.value = "";
                applyFilters();
            }
        });

        filterInput.addEventListener("input", applyFilters);

        sortBtn.addEventListener("click", () => {
            sortColumn(index);
        });

        head.appendChild(th);
    });

    const actionHead = document.createElement("th");
    actionHead.textContent = "Actions";
    head.appendChild(actionHead);

    applyFilters();
}

// ======================================
// APPLY COLUMN FILTERS
// ======================================

function applyFilters() {
    const filters = document.querySelectorAll(".column-filter");

    const filteredRecords = allRecords.filter(record => {
        return currentColumns.every((column, index) => {
            const filterValue = filters[index].value.trim().toLowerCase();

            if (!filterValue) return true;

            let value = record[column] ?? "";

            if (isDateColumn(column)) {
                value = formatDateForDisplay(value);
            } else if (isTimeColumn(column)) {
                value = formatTimeForDisplay(value);
            }

            return String(value).toLowerCase().includes(filterValue);
        });
    });

    renderFilteredRows(filteredRecords, currentColumns);

    document.getElementById("recordCount").textContent =
        `${filteredRecords.length} of ${allRecords.length} records found`;
}

// ======================================
// SORT COLUMN
// ======================================

function sortColumn(index) {
    const column = currentColumns[index];

    sortDirections[column] = !sortDirections[column];

    allRecords.sort((a, b) => {
        let valueA = a[column] ?? "";
        let valueB = b[column] ?? "";

        if (isDateColumn(column)) {
            valueA = String(valueA).split("T")[0];
            valueB = String(valueB).split("T")[0];
        }

        if (
            typeof valueA === "number" &&
            typeof valueB === "number"
        ) {
            return sortDirections[column]
                ? valueA - valueB
                : valueB - valueA;
        }

        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();

        return sortDirections[column]
            ? valueA.localeCompare(valueB, undefined, { numeric: true })
            : valueB.localeCompare(valueA, undefined, { numeric: true });
    });

    applyFilters();
}

// ======================================
// DISPLAY FILTERED RECORDS
// ======================================

function renderFilteredRows(records, columns) {
    const tbody = document.getElementById("tableBody");

    tbody.innerHTML = "";

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100">No matching records found.</td>
            </tr>
        `;
        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");

        columns.forEach(column => {
            const td = document.createElement("td");

            let value = record[column];

            if (isDateColumn(column) && value !== null) {
                value = formatDateForDisplay(value);
            } else if (isTimeColumn(column) && value !== null) {
                value = formatTimeForDisplay(value);
            }

            td.textContent = value ?? "NULL";
            row.appendChild(td);
        });

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", () => {
            editRecord(record, row, columns);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteRecord(record.id);
        });

        actionCell.append(editButton, deleteButton);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

// ======================================
// EDIT RECORD
// ======================================

function editRecord(record, row, columns) {
    const cells = row.querySelectorAll("td");

    columns.forEach((column, index) => {
        if (column.toLowerCase() === "id") return;

        const cell = cells[index];
        const input = createInput(column);

        let value = record[column] ?? "";

        if (isDateColumn(column)) {
            value = formatDateForDisplay(value);
        } else if (isTimeColumn(column)) {
            value = formatTimeForDisplay(value);
        }

        input.value = value;
        input.dataset.column = column;

        cell.innerHTML = "";
        cell.appendChild(input);
    });

    const actionCell = cells[columns.length];
    actionCell.innerHTML = "";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.className = "save-btn";

    saveButton.addEventListener("click", () => {
        saveRecord(record.id, row);
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "edit-btn";

    cancelButton.addEventListener("click", () => {
        loadTable(currentTable);
    });

    actionCell.append(saveButton, cancelButton);
}

// ======================================
// SAVE UPDATED RECORD
// ======================================

async function saveRecord(id, row) {
    const updates = {};

    try {
        row.querySelectorAll("input, textarea").forEach(input => {
            const column = input.dataset.column;

            let value = input.value.trim();

            if (value === "") return;

            if (isDateColumn(column)) {
                value = convertDateToDatabase(value);
            } else if (isTimeColumn(column)) {
                value = convertTimeToDatabase(value);
            } else if (input.type === "number") {
                value = Number(value);
            }

            updates[column] = value;
        });

        if (Object.keys(updates).length === 0) {
            throw new Error("No changes to save.");
        }

        const response = await fetch(
            `${API}/${currentTable}/records/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updates)
            }
        );

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Unable to update record");
        }

        showMessage("Record updated successfully!", "success");

        await loadTable(currentTable);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

// ======================================
// DELETE RECORD
// ======================================

async function deleteRecord(id) {
    if (!confirm("Are you sure you want to delete this record?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/${currentTable}/records/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Unable to delete record");
        }

        showMessage("Record deleted successfully!", "success");

        await loadTable(currentTable);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

// ======================================
// DYNAMIC ADD RECORD FORM
// ======================================

async function openAddRecordForm() {
    const form = document.getElementById("addRecordForm");

    form.style.display = "block";
    form.innerHTML = "<p>Loading fields...</p>";

    try {
        const response = await fetch(
            `${API}/${currentTable}/columns`
        );

        const columns = await readResponse(response);

        if (!response.ok) {
            throw new Error(columns.message || "Unable to load columns");
        }

        if (!Array.isArray(columns)) {
            throw new Error("Invalid columns response");
        }

        const addColumns = columns.filter(
            column => column.toLowerCase() !== "id"
        );

        form.innerHTML = "";

        const heading = document.createElement("h3");
        heading.textContent =
            `Add New ${currentTable.replace("_", " ")}`;

        form.appendChild(heading);

        const fieldsContainer = document.createElement("div");
        fieldsContainer.className = "dynamic-fields";

        addColumns.forEach(column => {
            const wrapper = document.createElement("div");
            wrapper.className = "form-group";

            const label = document.createElement("label");
            label.textContent =
                column.replaceAll("_", " ").toUpperCase();

            const input = createInput(column);

            wrapper.append(label, input);
            fieldsContainer.appendChild(wrapper);
        });

        form.appendChild(fieldsContainer);

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.id = "saveNewRecordBtn";
        saveButton.textContent = "Save Record";
        saveButton.className = "save-btn";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.id = "cancelNewRecordBtn";
        cancelButton.textContent = "Cancel";
        cancelButton.className = "edit-btn";

        form.append(saveButton, cancelButton);

        saveButton.addEventListener("click", addRecord);
        cancelButton.addEventListener("click", closeAddRecordForm);

    } catch (error) {
        form.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
        showMessage(error.message, "error");
    }
}

// ======================================
// CREATE INPUT BASED ON COLUMN NAME
// ======================================

function createInput(column) {
    const name = column.toLowerCase();

    const input = document.createElement(
        name.includes("description") ? "textarea" : "input"
    );

    input.name = column;
    input.dataset.column = column;

    if (isDateColumn(column)) {
        input.type = "text";
        input.placeholder = "DD/MM/YYYY";
        input.autocomplete = "off";
        input.inputMode = "numeric";
        input.pattern = "\\d{2}/\\d{2}/\\d{4}";

    } else if (isTimeColumn(column)) {
        input.type = "text";
        input.placeholder = "HH:MM AM/PM";
        input.autocomplete = "off";
        input.pattern = "(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM|am|pm)";

    } else if (
        name.includes("price") ||
        name.includes("amount") ||
        name.includes("quantity") ||
        name.includes("age")
    ) {
        input.type = "number";
        input.step = "any";

    } else if (name.includes("email")) {
        input.type = "email";

    } else if (name.includes("url") || name.includes("image")) {
        input.type = "url";

    } else {
        input.type = "text";
    }

    return input;
}

// ======================================
// ADD RECORD
// ======================================

async function addRecord() {
    const form = document.getElementById("addRecordForm");

    const inputs = form.querySelectorAll("[data-column]");
    const record = {};

    try {
        for (const input of inputs) {
            const column = input.dataset.column;

            let value = input.value.trim();

            if (value === "") continue;

            if (isDateColumn(column)) {
                value = convertDateToDatabase(value);
            } else if (isTimeColumn(column)) {
                value = convertTimeToDatabase(value);
            } else if (input.type === "number") {
                value = Number(value);

                if (!Number.isFinite(value)) {
                    throw new Error(`Enter a valid value for ${column}`);
                }
            }

            record[column] = value;
        }

        if (Object.keys(record).length === 0) {
            throw new Error("Enter at least one field.");
        }

        const response = await fetch(
            `${API}/${currentTable}/records`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(record)
            }
        );

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Unable to add record");
        }

        closeAddRecordForm();

        showMessage("Record added successfully!", "success");

        await loadTable(currentTable);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

// ======================================
// CLOSE ADD RECORD FORM
// ======================================

function closeAddRecordForm() {
    const form = document.getElementById("addRecordForm");

    form.style.display = "none";
    form.innerHTML = "";
}

// ======================================
// BULK SEAT GENERATION
// ======================================

async function generateSeats(event) {
    event.preventDefault();

    const form = document.getElementById("generateSeatsForm");
    const message = document.getElementById("generatorMessage");
    const submitButton = form.querySelector("button[type='submit']");

    let requestData;

    try {
        requestData = {
            eventId: Number(document.getElementById("genEventId").value),
            date: convertDateToDatabase(document.getElementById("genDate").value),
            time: document.getElementById("genTime").value.trim().toUpperCase(),
            rowName: document.getElementById("genRowName").value.trim().toUpperCase(),
            seatCount: Number(document.getElementById("genSeatCount").value),
            price: Number(document.getElementById("genPrice").value)
        };
    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
        return;
    }

    message.textContent = "Generating seats...";
    submitButton.disabled = true;

    try {
        const response = await fetch("/api/seats/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Unable to generate seats");
        }

        message.textContent =
            `${result.createdSeats} seats created successfully!`;

        message.style.color = "green";

        form.reset();

        if (currentTable === "seats") {
            await loadTable("seats");
        }

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";

    } finally {
        submitButton.disabled = false;
    }
}

// ======================================
// BUTTON EVENT LISTENERS
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".table-btn").forEach(button => {
        button.addEventListener("click", () => {
            loadTable(button.dataset.table);
        });
    });

    document.getElementById("refreshBtn").addEventListener("click", () => {
        loadTable(currentTable);
    });

    document.getElementById("addRecordBtn").addEventListener("click", () => {
        openAddRecordForm();
    });

    document.getElementById("generateSeatsForm").addEventListener(
        "submit",
        generateSeats
    );

    loadTable("events");
});
