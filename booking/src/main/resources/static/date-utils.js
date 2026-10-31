function formatDate(dateValue) {
    if (!dateValue) return "";

    const date = String(dateValue).split("T")[0];
    const parts = date.split("-");

    if (parts.length !== 3) return dateValue;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function toDatabaseDate(dateValue) {
    if (!dateValue) return "";

    const value = String(dateValue).trim();

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        throw new Error("Enter date in DD/MM/YYYY format");
    }

    return `${match[3]}-${match[2]}-${match[1]}`;
}