package com.example.tickethub.controller;

import com.example.tickethub.entity.Seat;
import com.example.tickethub.service.SeatService;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping("/availability")
    public List<Seat> getSeats(
            @RequestParam Long eventId,
            @RequestParam LocalDate date,
            @RequestParam String time) {

        return seatService.getAvailableSeats(eventId, date, time);
    }

    @PostMapping("/generate")
    public Map<String, Object> generateSeats(
            @RequestBody Map<String, Object> request) {

        Long eventId = Long.valueOf(request.get("eventId").toString());
        LocalDate date = LocalDate.parse(request.get("date").toString());
        String time = request.get("time").toString();
        String rowName = request.get("rowName").toString();
        int seatCount = Integer.parseInt(request.get("seatCount").toString());
        double price = Double.parseDouble(request.get("price").toString());

        int created = seatService.generateSeats(
                eventId, date, time, rowName, seatCount, price
        );

        return Map.of(
                "message", "Seats generated successfully",
                "createdSeats", created
        );
    }
}