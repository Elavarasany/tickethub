package com.example.tickethub.service;

import com.example.tickethub.entity.Event;
import com.example.tickethub.entity.EventSlot;
import com.example.tickethub.repository.EventRepository;
import com.example.tickethub.repository.EventSlotRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final EventSlotRepository eventSlotRepository;

    public EventService(EventRepository eventRepository,
                        EventSlotRepository eventSlotRepository) {
        this.eventRepository = eventRepository;
        this.eventSlotRepository = eventSlotRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<Event> getByCategory(String category) {
        return eventRepository.findByCategoryIgnoreCase(category);
    }

    public Event getEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    public List<EventSlot> getSlots(Long eventId, LocalDate date) {
        return eventSlotRepository.findByEventIdAndDate(eventId, date);
    }

    public List<LocalDate> getAvailableDates(Long eventId) {
        return eventSlotRepository.findAvailableDates(eventId);
    }
}