package com.example.tickethub.service;

import com.example.tickethub.entity.Event;
import com.example.tickethub.entity.EventSlot;
import com.example.tickethub.entity.Seat;
import com.example.tickethub.repository.EventRepository;
import com.example.tickethub.repository.EventSlotRepository;
import com.example.tickethub.repository.SeatRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final EventSlotRepository eventSlotRepository;

    private static final DateTimeFormatter INPUT_FORMAT =
            new DateTimeFormatterBuilder()
                    .parseCaseInsensitive()
                    .appendPattern("h:mma")
                    .toFormatter(Locale.ENGLISH);

    private static final DateTimeFormatter OUTPUT_FORMAT =
            DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    public SeatService(
            SeatRepository seatRepository,
            EventRepository eventRepository,
            EventSlotRepository eventSlotRepository) {

        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.eventSlotRepository = eventSlotRepository;
    }

    private String normalizeTime(String time) {

        if (time == null || time.isBlank()) {
            throw new IllegalArgumentException("Time is required");
        }

        try {
            String cleaned = time.trim()
                    .toUpperCase(Locale.ENGLISH)
                    .replaceAll("\\s+", "");

            LocalTime parsed = LocalTime.parse(cleaned, INPUT_FORMAT);

            return parsed.format(OUTPUT_FORMAT);

        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Invalid time. Use format like 05:00 PM"
            );
        }
    }

    private String getMatchingSlotTime(
            Long eventId,
            LocalDate date,
            String requestedTime) {

        String normalizedRequestedTime = normalizeTime(requestedTime);

        List<EventSlot> slots =
                eventSlotRepository.findByEventIdAndDate(eventId, date);

        for (EventSlot slot : slots) {

            String slotTime = normalizeTime(slot.getTime());

            if (slotTime.equals(normalizedRequestedTime)) {
                return slot.getTime();
            }
        }

        throw new IllegalArgumentException(
                "No matching event slot found for " + date
                        + " at " + normalizedRequestedTime
        );
    }

    public List<Seat> getAvailableSeats(
            Long eventId,
            LocalDate date,
            String time) {

        String matchingTime = getMatchingSlotTime(eventId, date, time);

        return seatRepository.findByEventIdAndEventDateAndEventTime(
                eventId, date, matchingTime
        );
    }

    @Transactional
    public int generateSeats(
            Long eventId,
            LocalDate date,
            String time,
            String rowName,
            int seatCount,
            double price) {

        if (rowName == null || !rowName.trim().matches("[A-Za-z]+")) {
            throw new IllegalArgumentException("Invalid row name");
        }

        if (seatCount < 1 || seatCount > 500) {
            throw new IllegalArgumentException(
                    "Seat count must be between 1 and 500"
            );
        }

        if (price < 0 || !Double.isFinite(price)) {
            throw new IllegalArgumentException("Invalid ticket price");
        }

        if (date == null) {
            throw new IllegalArgumentException("Date is required");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Event not found"));

        // Find the actual slot time stored in event_slots.
        String matchingTime = getMatchingSlotTime(eventId, date, time);

        List<Seat> existingSeats =
                seatRepository.findByEventIdAndEventDateAndEventTime(
                        eventId, date, matchingTime
                );

        Set<String> existingNumbers = existingSeats.stream()
                .map(Seat::getSeatNumber)
                .collect(Collectors.toSet());

        List<Seat> newSeats = new ArrayList<>();

        String row = rowName.trim().toUpperCase(Locale.ENGLISH);

        for (int i = 1; i <= seatCount; i++) {

            String seatNumber = row + i;

            if (existingNumbers.contains(seatNumber)) {
                continue;
            }

            Seat seat = new Seat();

            seat.setEvent(event);
            seat.setEventDate(date);
            seat.setEventTime(matchingTime);
            seat.setSeatNumber(seatNumber);
            seat.setPrice(price);
            seat.setBooked(false);

            newSeats.add(seat);
        }

        seatRepository.saveAll(newSeats);

        return newSeats.size();
    }
}