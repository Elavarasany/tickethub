package com.example.tickethub.admin;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @ExceptionHandler(Exception.class)
    public org.springframework.http.ResponseEntity<Map<String, String>> handleError(
            Exception ex) {

        return org.springframework.http.ResponseEntity
                .badRequest()
                .body(Map.of(
                        "message",
                        ex.getMessage() == null ? "Unknown error" : ex.getMessage()
                ));
    }

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/tables")
    public List<String> getTables() {
        return adminService.getTables();
    }

    @GetMapping("/tables/{tableName}/columns")
    public List<String> getColumns(@PathVariable String tableName) {
        return adminService.getColumns(tableName);
    }

    @GetMapping("/tables/{tableName}/records")
    public List<Map<String, Object>> getRecords(
            @PathVariable String tableName) {
        return adminService.getRecords(tableName);
    }

    // Add a record to any allowed table
    @PostMapping("/tables/{tableName}/records")
    public Map<String, String> addRecord(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> record) {

        adminService.addRecord(tableName, record);

        return Map.of("message", "Record added successfully");
    }

    @PutMapping("/tables/{tableName}/records/{id}")
    public Map<String, String> updateRecord(
            @PathVariable String tableName,
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        adminService.updateRecord(tableName, id, updates);

        return Map.of("message", "Record updated successfully");
    }

    @DeleteMapping("/tables/{tableName}/records/{id}")
    public Map<String, String> deleteRecord(
            @PathVariable String tableName,
            @PathVariable Long id) {

        adminService.deleteRecord(tableName, id);

        return Map.of("message", "Record deleted successfully");
    }
}