package com.example.tickethub.controller;

import com.example.tickethub.entity.Booking;
import com.example.tickethub.service.BookingService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    public record BookingRequest(
            String customerName,
            String customerEmail,
            String customerPhone,
            Long eventId,
            LocalDate eventDate,
            String eventTime,
            List<String> selectedSeats
    ) {}

    @PostMapping
    public Booking createBooking(@RequestBody BookingRequest request) {

        return bookingService.createBooking(
                request.customerName(),
                request.customerEmail(),
                request.customerPhone(),
                request.eventId(),
                request.eventDate(),
                request.eventTime(),
                request.selectedSeats()
        );
    }

    @GetMapping("/{bookingId}")
    public Booking getBooking(@PathVariable Long bookingId) {
        return bookingService.getBooking(bookingId);
    }

    @GetMapping
    public List<Booking> getBookings(@RequestParam String email) {
        return bookingService.getBookingsByEmail(email);
    }
}