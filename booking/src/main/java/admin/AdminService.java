
package com.example.tickethub.admin;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminService {

    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> ALLOWED_TABLES = Set.of(
            "events",
            "event_slots",
            "seats",
            "bookings"
    );

    public AdminService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<String> getTables() {
        return new ArrayList<>(ALLOWED_TABLES);
    }

    private void validateTable(String tableName) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("Invalid table name");
        }
    }

    public List<String> getColumns(String tableName) {
        validateTable(tableName);

        String sql = """
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
                """;

        return jdbcTemplate.queryForList(sql, String.class, tableName);
    }

    public List<Map<String, Object>> getRecords(String tableName) {
        validateTable(tableName);

        String sql = "SELECT * FROM `" + tableName + "`";
        return jdbcTemplate.queryForList(sql);
    }

    public void addRecord(String tableName, Map<String, Object> record) {
        validateTable(tableName);

        if (record == null || record.isEmpty()) {
            throw new IllegalArgumentException("No record data provided");
        }

        List<String> columns = getColumns(tableName);
        List<String> insertColumns = new ArrayList<>();
        List<Object> values = new ArrayList<>();

        for (Map.Entry<String, Object> entry : record.entrySet()) {
            String column = entry.getKey();

            if (column.equalsIgnoreCase("id")) {
                continue;
            }

            if (!columns.contains(column)) {
                throw new IllegalArgumentException("Invalid column: " + column);
            }

            if (entry.getValue() == null) {
                continue;
            }

            insertColumns.add("`" + column + "`");
            values.add(entry.getValue());
        }

        if (insertColumns.isEmpty()) {
            throw new IllegalArgumentException("No valid values provided");
        }

        String placeholders = String.join(
                ", ",
                java.util.Collections.nCopies(insertColumns.size(), "?")
        );

        String sql = "INSERT INTO `" + tableName + "` ("
                + String.join(", ", insertColumns)
                + ") VALUES (" + placeholders + ")";

        jdbcTemplate.update(sql, values.toArray());
    }

    public void updateRecord(
            String tableName,
            Long id,
            Map<String, Object> updates) {

        validateTable(tableName);

        if (updates == null || updates.isEmpty()) {
            throw new IllegalArgumentException("No update values provided");
        }

        List<String> columns = getColumns(tableName);
        List<String> updateColumns = new ArrayList<>();
        List<Object> values = new ArrayList<>();

        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            String column = entry.getKey();

            if (!columns.contains(column)) {
                throw new IllegalArgumentException("Invalid column: " + column);
            }

            if (column.equalsIgnoreCase("id")) {
                continue;
            }

            Object value = entry.getValue();

            if (column.equalsIgnoreCase("booked") && value != null) {
                if (value instanceof Boolean) {
                    // Keep the Boolean value
                } else {
                    value = Boolean.parseBoolean(value.toString());
                }
            }

            updateColumns.add("`" + column + "` = ?");
            values.add(value);
        }

        if (updateColumns.isEmpty()) {
            throw new IllegalArgumentException("No valid columns to update");
        }

        String sql = "UPDATE `" + tableName + "` SET "
                + String.join(", ", updateColumns)
                + " WHERE id = ?";

        values.add(id);

        jdbcTemplate.update(sql, values.toArray());
    }

    public void deleteRecord(String tableName, Long id) {
        validateTable(tableName);

        int rows = jdbcTemplate.update(
                "DELETE FROM `" + tableName + "` WHERE id = ?",
                id
        );

        if (rows == 0) {
            throw new IllegalArgumentException("Record not found");
        }
    }
}
