package com.example.tickethub.admin;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    @Value("${ADMIN_USERNAME}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD}")
    private String adminPassword;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> data,
            HttpSession session) {

        String username = data.get("username");
        String password = data.get("password");

        if (username == null || password == null ||
                !adminUsername.equals(username) ||
                !adminPassword.equals(password)) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid username or password"));
        }

        session.setAttribute("ADMIN_LOGGED_IN", true);

        return ResponseEntity.ok(
                Map.of("message", "Login successful")
        );
    }

    @GetMapping("/check")
    public ResponseEntity<?> check(HttpSession session) {
        boolean loggedIn =
                Boolean.TRUE.equals(session.getAttribute("ADMIN_LOGGED_IN"));

        return loggedIn
                ? ResponseEntity.ok(Map.of("authenticated", true))
                : ResponseEntity.status(401)
                .body(Map.of("authenticated", false));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully")
        );
    }
}