
const API_BASE_URL = window.location.origin;

const API = {
    events: `${API_BASE_URL}/api/events`,
    event: id => `${API_BASE_URL}/api/events/${id}`,
    dates: id => `${API_BASE_URL}/api/events/${id}/dates`,

    slots: (id, date) =>
        `${API_BASE_URL}/api/events/${id}/slots?date=${encodeURIComponent(date)}`,

    seats: (id, date, time) =>
        `${API_BASE_URL}/api/seats/availability?eventId=${encodeURIComponent(id)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,

    bookings: `${API_BASE_URL}/api/bookings`,

    booking: id =>
        `${API_BASE_URL}/api/bookings/${encodeURIComponent(id)}`,

    customerBookings: email =>
        `${API_BASE_URL}/api/bookings?email=${encodeURIComponent(email)}`
};

let events = [];
let selectedEvent = null;
let selectedDate = null;
let selectedTime = null;
let selectedSeats = [];
let availableSeats = [];
let currentBooking = null;
let previousPage = "home";

// --------------------------------
// COMMON FUNCTIONS
// --------------------------------

const $ = id => document.getElementById(id);

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function formatDate(dateValue) {
    if (!dateValue) return "";

    const value = String(dateValue).trim().split("T")[0];

    const displayMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (displayMatch) return value;

    const databaseMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (databaseMatch) {
        return `${databaseMatch[3]}/${databaseMatch[2]}/${databaseMatch[1]}`;
    }

    return value;
}

function parseLocalDate(dateValue) {
    const value = String(dateValue || "").trim().split("T")[0];
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return null;

    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
    );
}

function formatBookingTime(time) {
    if (!time) return "";

    const parts = String(time).trim().match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!parts) return time;

    let hours = Number(parts[1]);
    const minutes = parts[2];

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const responseText = await response.text();

    let data = null;

    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch {
        data = responseText;
    }

    if (!response.ok) {
        const message =
            typeof data === "string"
                ? data
                : data?.message || data?.error || `HTTP ${response.status}`;

        throw new Error(message);
    }

    return data;
}

function showToast(message, type = "success") {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

// --------------------------------
// PAGE NAVIGATION
// --------------------------------

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = $(pageId);

    if (!page) {
        console.error("Page not found:", pageId);
        return;
    }

    page.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );
    });

    document.querySelector(".nav-links")?.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function goBack() {
    showPage(previousPage || "home");
}

// --------------------------------
// LOAD EVENTS
// --------------------------------

async function loadEvents() {
    try {
        const result = await apiRequest(API.events);

        events = Array.isArray(result) ? result : [];

        renderAllEvents();

    } catch (error) {
        console.error("Unable to load events:", error);
        showToast("Unable to load events. Check your backend.", "error");
    }
}

function renderAllEvents() {
    renderEventList("trendingEvents", events.slice(0, 3));
    renderEventList("upcomingEvents", events.slice(3, 6));

    renderEventList(
        "movieEvents",
        events.filter(e => isCategory(e, "movie"))
    );

    renderEventList(
        "musicEvents",
        events.filter(e => isCategory(e, "music"))
    );

    renderEventList(
        "sportsEvents",
        events.filter(e => isCategory(e, "sport"))
    );
}

function isCategory(event, category) {
    return String(event.category || "")
        .toLowerCase()
        .includes(category);
}

// --------------------------------
// EVENT CARDS
// --------------------------------

function renderEventList(containerId, list) {
    const container = $(containerId);

    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML =
            `<p class="empty-message">No events available.</p>`;
        return;
    }

    container.innerHTML = list.map(event => `
        <div class="event-card">
            <img
                class="event-poster"
                src="${escapeHTML(event.imageUrl || "")}"
                alt="${escapeHTML(event.name)}"
                onerror="this.src='https://placehold.co/600x400?text=Event'"
            >

            <div class="event-card-content">

                <span class="event-category">
                    ${escapeHTML(event.category)}
                </span>

                <h3>${escapeHTML(event.name)}</h3>

                <p class="event-meta">
                    📍 ${escapeHTML(event.venue || "Venue not available")}
                </p>

                <div class="event-card-bottom">

                    <div class="price">
                        ${money(event.price)}
                        <small>Starting price</small>
                    </div>

                    <button
                        class="book-btn"
                        onclick="openEvent(${Number(event.id)})">
                        Book Now →
                    </button>

                </div>
            </div>
        </div>
    `).join("");
}

// --------------------------------
// CATEGORY SEARCH AND FILTER
// --------------------------------

function filterEvents(inputId, containerId, category) {
    const search = $(inputId)?.value.toLowerCase() || "";

    let filtered = events.filter(event =>
        isCategory(event, category)
    );

    filtered = filtered.filter(event =>
        String(event.name || "").toLowerCase().includes(search) ||
        String(event.venue || "").toLowerCase().includes(search)
    );

    if (category === "movie") {
        const genre = $("movieFilter")?.value;

        if (genre && genre !== "all") {
            filtered = filtered.filter(event =>
                String(event.category || "").toLowerCase().includes(genre.toLowerCase()) ||
                String(event.description || "").toLowerCase().includes(genre.toLowerCase())
            );
        }
    }

    renderEventList(containerId, filtered);
}

function searchEvents() {
    const search = $("homeSearch")?.value.trim().toLowerCase();

    if (!search) {
        showToast("Enter an event name to search.", "error");
        return;
    }

    const filtered = events.filter(event =>
        String(event.name || "").toLowerCase().includes(search) ||
        String(event.category || "").toLowerCase().includes(search) ||
        String(event.venue || "").toLowerCase().includes(search)
    );

    showPage("movies");
    renderEventList("movieEvents", filtered);
}

// --------------------------------
// OPEN EVENT
// --------------------------------

async function openEvent(id) {
    try {
        const [event, dates] = await Promise.all([
            apiRequest(API.event(id)),
            apiRequest(API.dates(id))
        ]);

        if (!event) {
            throw new Error("Event not found.");
        }

        event.dates = Array.isArray(dates) ? dates : [];

        selectedEvent = event;
        selectedDate = null;
        selectedTime = null;
        selectedSeats = [];
        availableSeats = [];
        currentBooking = null;

        previousPage = "home";

        renderEventDetails();
        showPage("eventDetails");

    } catch (error) {
        console.error("Unable to open event:", error);
        showToast(error.message || "Unable to open event.", "error");
    }
}

// --------------------------------
// EVENT DETAILS AND DATES
// --------------------------------

function renderEventDetails() {
    if (!selectedEvent) return;

    const container = $("eventDetailContent");

    if (!container) return;

    container.innerHTML = `
        <div class="event-detail-card">

            <div>
                <img
                    class="detail-image"
                    src="${escapeHTML(selectedEvent.imageUrl || "")}"
                    alt="${escapeHTML(selectedEvent.name)}"
                    onerror="this.src='https://placehold.co/600x400?text=Event'"
                >
            </div>

            <div class="detail-info">

                <span class="event-category">
                    ${escapeHTML(selectedEvent.category)}
                </span>

                <h1>${escapeHTML(selectedEvent.name)}</h1>

                <p class="detail-description">
                    ${escapeHTML(selectedEvent.description || "Enjoy this event with TICKET HUB.")}
                </p>

                <div class="detail-meta">
                    <strong>Venue</strong>
                    ${escapeHTML(selectedEvent.venue || "Not available")}
                </div>

                <div class="detail-meta">
                    <strong>Price</strong>
                    ${money(selectedEvent.price)}
                </div>

                <h3 class="selection-heading">Select a date</h3>
                <div class="date-list" id="dateList"></div>

                <h3 class="selection-heading">Select a time</h3>

                <div class="slot-list" id="slotList">
                    <p class="muted">Select a date first.</p>
                </div>

            </div>
        </div>
    `;

    renderDates();
}

function renderDates() {
    const container = $("dateList");

    if (!container) return;

    const dates = selectedEvent?.dates || [];

    if (dates.length === 0) {
        container.innerHTML =
            `<p class="muted">No available dates for this event.</p>`;
        return;
    }

    container.innerHTML = dates.map(date => {
        const parsedDate = parseLocalDate(date);

        const weekday = parsedDate
            ? parsedDate.toLocaleDateString("en-IN", {
                weekday: "short"
            })
            : "";

        return `
            <button
                class="date-option ${selectedDate === date ? "active" : ""}"
                onclick="selectDate('${escapeHTML(date)}')">

                <small>${escapeHTML(weekday)}</small>

                ${escapeHTML(formatDate(date))}
            </button>
        `;
    }).join("");
}

// --------------------------------
// SELECT DATE AND LOAD TIMES
// --------------------------------

async function selectDate(date) {
    if (!selectedEvent) return;

    selectedDate = date;
    selectedTime = null;
    selectedSeats = [];
    availableSeats = [];

    renderDates();

    const slotList = $("slotList");

    if (slotList) {
        slotList.innerHTML =
            `<p class="muted">Loading time slots...</p>`;
    }

    try {
        const slots = await apiRequest(
            API.slots(selectedEvent.id, date)
        );

        if (selectedDate !== date) return;

        renderSlots(slots);

    } catch (error) {
        console.error("Unable to load time slots:", error);

        if (slotList) {
            slotList.innerHTML =
                `<p class="muted">Unable to load time slots.</p>`;
        }

        showToast(error.message, "error");
    }
}

function renderSlots(slots) {
    const container = $("slotList");

    if (!container) return;

    if (!Array.isArray(slots) || slots.length === 0) {
        container.innerHTML =
            `<p class="muted">No time slots available.</p>`;
        return;
    }

    container.innerHTML = slots.map(slot => {
        const time = typeof slot === "string" ? slot : slot.time;

        if (!time) return "";

        return `
            <button
                class="slot-option ${selectedTime === time ? "active" : ""}"
                data-time="${escapeHTML(time)}"
                onclick="selectTime('${escapeHTML(time)}')">

                ${escapeHTML(formatBookingTime(time))}
            </button>
        `;
    }).join("");
}

// --------------------------------
// SELECT TIME AND LOAD SEATS
// --------------------------------

async function selectTime(time) {
    if (!selectedEvent || !selectedDate || !time) return;

    selectedTime = time;
    selectedSeats = [];
    availableSeats = [];

    document.querySelectorAll(".slot-option").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.time === time
        );
    });

    await loadSeats();

    showPage("seatPage");
}

async function loadSeats() {
    if (!selectedEvent || !selectedDate || !selectedTime) return;

    const container = $("seatContainer");

    if (container) {
        container.innerHTML =
            `<p class="muted">Loading seats...</p>`;
    }

    const requestedEvent = selectedEvent.id;
    const requestedDate = selectedDate;
    const requestedTime = selectedTime;

    try {
        const result = await apiRequest(
            API.seats(requestedEvent, requestedDate, requestedTime)
        );

        if (
            selectedEvent?.id !== requestedEvent ||
            selectedDate !== requestedDate ||
            selectedTime !== requestedTime
        ) {
            return;
        }

        availableSeats = Array.isArray(result) ? result : [];

        console.log("Seat API response:", availableSeats);

        renderSeats();

    } catch (error) {
        console.error("Unable to load seats:", error);

        if (container) {
            container.innerHTML =
                `<p class="muted">Unable to load seats.</p>`;
        }

        showToast(error.message, "error");
    }
}

// --------------------------------
// RENDER SEATS
// --------------------------------

function renderSeats() {
    const container = $("seatContainer");

    if (!container) return;

    if (availableSeats.length === 0) {
        container.innerHTML =
            `<p class="muted">No seats available for this slot.</p>`;

        updateSeatSummary();
        return;
    }

    const rows = {};

    availableSeats.forEach(seat => {
        const seatNumber = String(seat.seatNumber || "");
        const row = seatNumber.match(/^[A-Za-z]+/)?.[0] || "A";

        if (!rows[row]) {
            rows[row] = [];
        }

        rows[row].push(seat);
    });

    const sortedRows = Object.keys(rows).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    container.innerHTML = sortedRows.map(row => {
        const sortedSeats = rows[row].sort((a, b) =>
            String(a.seatNumber).localeCompare(
                String(b.seatNumber),
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
        );

        return `
            <div class="seat-row">

                <span class="row-label">
                    ${escapeHTML(row)}
                </span>

                ${sortedSeats.map(seat => {
            const number = String(seat.seatNumber);

            const booked = seat.booked === true;
            const selected = selectedSeats.includes(number);

            const premium =
                String(seat.seatType || "").toUpperCase() === "PREMIUM";

            let seatClass = "available";

            if (booked) {
                seatClass = "booked";
            } else if (premium) {
                seatClass = "premium";
            }

            if (selected) {
                seatClass += " selected";
            }

            return `
                        <button
                            class="seat ${seatClass}"
                            ${booked ? "disabled" : ""}
                            onclick="toggleSeat('${escapeHTML(number)}')"
                            title="${escapeHTML(number)} - ${money(seat.price)}">

                            ${escapeHTML(number.replace(/^[A-Za-z]+/, ""))}
                        </button>
                    `;
        }).join("")}

            </div>
        `;
    }).join("");

    updateSeatSummary();
}

// --------------------------------
// SELECT / DESELECT SEATS
// --------------------------------

function toggleSeat(seatNumber) {
    const seat = availableSeats.find(
        item => String(item.seatNumber) === String(seatNumber)
    );

    if (!seat || seat.booked === true) return;

    if (selectedSeats.includes(seatNumber)) {
        selectedSeats = selectedSeats.filter(
            number => number !== seatNumber
        );
    } else {
        if (selectedSeats.length >= 10) {
            showToast("You can select a maximum of 10 seats.", "error");
            return;
        }

        selectedSeats.push(seatNumber);
    }

    renderSeats();
}

function getTotalPrice() {
    return selectedSeats.reduce((total, number) => {
        const seat = availableSeats.find(
            item => String(item.seatNumber) === String(number)
        );

        return total + Number(seat?.price || 0);
    }, 0);
}

function updateSeatSummary() {
    const selected = $("selectedSeats");
    const count = $("ticketCount");
    const total = $("totalPrice");
    const continueButton = $("continueBtn");

    if (selected) {
        selected.textContent =
            selectedSeats.length ? selectedSeats.join(", ") : "None";
    }

    if (count) {
        count.textContent = selectedSeats.length;
    }

    if (total) {
        total.textContent = money(getTotalPrice());
    }

    if (continueButton) {
        continueButton.disabled = selectedSeats.length === 0;
    }

    if ($("seatEventInfo") && selectedEvent) {
        $("seatEventInfo").textContent =
            `${selectedEvent.name} | ${formatDate(selectedDate)} | ${formatBookingTime(selectedTime)}`;
    }
}

// --------------------------------
// CUSTOMER CHECKOUT
// --------------------------------

function goToCustomer() {
    if (!selectedEvent || !selectedDate || !selectedTime) {
        showToast("Please select an event, date and time.", "error");
        return;
    }

    if (selectedSeats.length === 0) {
        showToast("Please select at least one seat.", "error");
        return;
    }

    renderCheckoutSummary();
    showPage("customerPage");
}

function renderCheckoutSummary() {
    const container = $("checkoutSummary");

    if (!container || !selectedEvent) return;

    container.innerHTML = `
        <div class="checkout-line">
            <span>Event</span>
            <strong>${escapeHTML(selectedEvent.name)}</strong>
        </div>

        <div class="checkout-line">
            <span>Date</span>
            <strong>${escapeHTML(formatDate(selectedDate))}</strong>
        </div>

        <div class="checkout-line">
            <span>Time</span>
            <strong>${escapeHTML(formatBookingTime(selectedTime))}</strong>
        </div>

        <div class="checkout-line">
            <span>Seats</span>
            <strong>${selectedSeats.map(escapeHTML).join(", ")}</strong>
        </div>

        <div class="checkout-line">
            <span>Tickets</span>
            <strong>${selectedSeats.length}</strong>
        </div>

        <div class="checkout-line">
            <span>Total</span>
            <strong>${money(getTotalPrice())}</strong>
        </div>
    `;
}

// --------------------------------
// CONFIRM BOOKING
// --------------------------------

async function confirmBooking(event) {
    event.preventDefault();

    const name = $("customerName")?.value.trim() || "";
    const email = $("customerEmail")?.value.trim() || "";
    const phone = $("customerPhone")?.value.trim() || "";

    const error = $("formError");
    const button = $("confirmBtn");

    if (!selectedEvent || !selectedDate || !selectedTime) {
        if (error) {
            error.textContent = "Please select an event, date and time.";
        }
        return;
    }

    if (selectedSeats.length === 0) {
        if (error) {
            error.textContent = "Please select at least one seat.";
        }
        return;
    }

    if (!name || !email || !phone) {
        if (error) {
            error.textContent = "Please fill in all details.";
        }
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (error) {
            error.textContent = "Enter a valid email address.";
        }
        return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
        if (error) {
            error.textContent = "Enter a valid 10-digit mobile number.";
        }
        return;
    }

    if (error) error.textContent = "";

    if (button) {
        button.disabled = true;
        button.textContent = "Processing...";
    }

    // These names must match BookingController.BookingRequest.
    const bookingData = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        eventId: selectedEvent.id,
        eventDate: selectedDate,
        eventTime: selectedTime,
        selectedSeats: [...selectedSeats]
    };

    try {
        // IMPORTANT: Submit only ONCE.
        const result = await apiRequest(API.bookings, {
            method: "POST",
            body: JSON.stringify(bookingData)
        });

        if (!result) {
            throw new Error("The server returned an empty booking response.");
        }

        currentBooking = result;

        renderReceipt(currentBooking);
        showPage("receiptPage");

        showToast("Booking confirmed successfully!");

    } catch (err) {
        console.error("Booking failed:", err);

        if (error) {
            error.textContent =
                err.message || "Booking failed. Please try again.";
        }

        showToast(
            err.message || "Unable to complete booking.",
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Confirm Booking →";
        }
    }
}

// --------------------------------
// BOOKING RECEIPT
// --------------------------------

function normalizeSeats(seats) {
    if (Array.isArray(seats)) return seats;

    if (typeof seats === "string") {
        return seats.split(",").map(s => s.trim()).filter(Boolean);
    }

    return [];
}

function renderReceipt(booking) {
    const container = $("receiptContent");

    if (!container) return;

    const seats = normalizeSeats(booking.selectedSeats);

    const bookingId = booking.id || booking.bookingId || "";

    const customerEmail =
        booking.customerEmail || booking.email || "";

    const ticketQuantity =
        booking.ticketQuantity ?? seats.length;

    container.innerHTML = `
        <div class="receipt-top">

            <div>
                <h3>TICKET HUB</h3>

                <p class="receipt-id">
                    Booking ID: #${escapeHTML(bookingId)}
                </p>
            </div>

            <div class="qr-placeholder">TICKET</div>

        </div>

        <div class="receipt-details">

            <div class="receipt-item">
                <span>Customer name</span>
                <strong>${escapeHTML(booking.customerName)}</strong>
            </div>

            <div class="receipt-item">
                <span>Email</span>
                <strong>${escapeHTML(customerEmail)}</strong>
            </div>

            <div class="receipt-item">
                <span>Event</span>
                <strong>${escapeHTML(selectedEvent?.name || booking.event?.name || "Event")}</strong>
            </div>

            <div class="receipt-item">
                <span>Date</span>
                <strong>${escapeHTML(formatDate(booking.eventDate || selectedDate || ""))}</strong>
            </div>

            <div class="receipt-item">
                <span>Time</span>
                <strong>${escapeHTML(formatBookingTime(booking.eventTime || selectedTime || ""))}</strong>
            </div>

            <div class="receipt-item">
                <span>Seats</span>
                <strong>${escapeHTML(seats.join(", "))}</strong>
            </div>

            <div class="receipt-item">
                <span>Number of tickets</span>
                <strong>${escapeHTML(ticketQuantity)}</strong>
            </div>

            <div class="receipt-item">
                <span>Status</span>
                <strong class="receipt-status">CONFIRMED</strong>
            </div>

        </div>

        <div class="receipt-total">
            <span>Total</span>
            <span>${money(booking.totalPrice)}</span>
        </div>
    `;
}

function downloadReceipt() {
    if (!currentBooking) {
        showToast("No receipt available.", "error");
        return;
    }

    window.print();
}

// --------------------------------
// MY BOOKINGS
// --------------------------------

async function loadBookings() {
    const email = $("bookingEmail")?.value.trim() || "";
    const list = $("bookingList");
    const message = $("bookingMessage");

    if (!email) {
        if (message) {
            message.textContent = "Enter your booking email.";
        }
        return;
    }

    if (!list || !message) return;

    message.textContent = "Loading bookings...";
    list.innerHTML = "";

    try {
        const bookings = await apiRequest(
            API.customerBookings(email)
        );

        if (!Array.isArray(bookings) || bookings.length === 0) {
            message.textContent =
                "No bookings found for this email.";
            return;
        }

        message.textContent =
            `${bookings.length} booking(s) found.`;

        list.innerHTML = bookings.map(booking => {
            const seats = normalizeSeats(booking.selectedSeats);

            const eventName = booking.event?.name || "Event";
            const image = booking.event?.imageUrl || "";

            return `
                <div class="booking-card">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(eventName)}"
                        onerror="this.src='https://placehold.co/200x150?text=Event'"
                    >

                    <div>
                        <h3>${escapeHTML(eventName)}</h3>

                        <p>
                            Booking ID:
                            #${escapeHTML(booking.id || booking.bookingId || "")}
                        </p>

                        <p>
                            Date:
                            ${escapeHTML(formatDate(booking.eventDate || ""))}
                        </p>

                        <p>
                            Time:
                            ${escapeHTML(formatBookingTime(booking.eventTime || ""))}
                        </p>

                        <p>
                            Seats:
                            ${escapeHTML(seats.join(", "))}
                        </p>

                        <p>
                            Total:
                            ${money(booking.totalPrice)}
                        </p>
                    </div>

                    <div>
                        <span class="booking-status">CONFIRMED</span>
                    </div>

                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Unable to load bookings:", error);

        message.textContent =
            error.message || "Unable to load bookings.";
    }
}

// --------------------------------
// MOBILE NAVIGATION
// --------------------------------

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", event => {
            event.preventDefault();
            showPage(item.dataset.page);
        });
    });

    $("menuToggle")?.addEventListener("click", () => {
        document.querySelector(".nav-links")?.classList.toggle("open");
    });
}

// --------------------------------
// SEARCH LISTENERS
// --------------------------------

function setupSearch() {
    $("movieSearch")?.addEventListener("input", () => {
        filterEvents("movieSearch", "movieEvents", "movie");
    });

    $("movieFilter")?.addEventListener("change", () => {
        filterEvents("movieSearch", "movieEvents", "movie");
    });

    $("musicSearch")?.addEventListener("input", () => {
        filterEvents("musicSearch", "musicEvents", "music");
    });

    $("sportsSearch")?.addEventListener("input", () => {
        filterEvents("sportsSearch", "sportsEvents", "sport");
    });

    $("homeSearch")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchEvents();
        }
    });
}

// --------------------------------
// INITIALIZE WEBSITE
// --------------------------------

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupSearch();

    $("customerForm")?.addEventListener(
        "submit",
        confirmBooking
    );

    loadEvents();
});
