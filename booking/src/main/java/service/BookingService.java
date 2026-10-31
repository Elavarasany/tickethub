package com.example.tickethub.service;

import com.example.tickethub.entity.*;
import com.example.tickethub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;

    public BookingService(BookingRepository bookingRepository,
                          EventRepository eventRepository,
                          SeatRepository seatRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
    }

    @Transactional
    public Booking createBooking(
            String name,
            String email,
            String phone,
            Long eventId,
            LocalDate date,
            String time,
            List<String> selectedSeats) {

        if (selectedSeats == null || selectedSeats.isEmpty()) {
            throw new RuntimeException("Select at least one seat");
        }

        if (selectedSeats.stream().distinct().count() != selectedSeats.size()) {
            throw new RuntimeException("Duplicate seats selected");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        List<Seat> seats = seatRepository.lockSelectedSeats(
                eventId, date, time, selectedSeats
        );

        if (seats.size() != selectedSeats.size()) {
            throw new RuntimeException("Some selected seats do not exist");
        }

        for (Seat seat : seats) {
            if (seat.isBooked()) {
                throw new RuntimeException(
                        "Seat already booked: " + seat.getSeatNumber()
                );
            }
        }

        double total = seats.stream()
                .mapToDouble(Seat::getPrice)
                .sum();

        Booking booking = new Booking();
        booking.setCustomerName(name);
        booking.setCustomerEmail(email);
        booking.setCustomerPhone(phone);
        booking.setEvent(event);
        booking.setEventDate(date);
        booking.setEventTime(time);
        booking.setSelectedSeats(String.join(",", selectedSeats));
        booking.setTicketQuantity(seats.size());
        booking.setTotalPrice(total);

        Booking savedBooking = bookingRepository.save(booking);

        for (Seat seat : seats) {
            seat.setBooked(true);
        }

        seatRepository.saveAll(seats);

        return savedBooking;
    }

    public Booking getBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public List<Booking> getBookingsByEmail(String email) {
        return bookingRepository.findByCustomerEmailIgnoreCase(email);
    }
}