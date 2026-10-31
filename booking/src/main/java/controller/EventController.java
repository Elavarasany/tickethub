package com.example.tickethub.controller;

import com.example.tickethub.entity.*;
import com.example.tickethub.service.EventService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventService.getAllEvents();
    }
    @GetMapping("/{id}/dates")
    public List<LocalDate> getAvailableDates(@PathVariable Long id) {
        return eventService.getAvailableDates(id);
    }

    @GetMapping("/category/{category}")
    public List<Event> getByCategory(@PathVariable String category) {
        return eventService.getByCategory(category);
    }

    @GetMapping("/{id}")
    public Event getEvent(@PathVariable Long id) {
        return eventService.getEvent(id);
    }

    @GetMapping("/{id}/slots")
    public List<EventSlot> getSlots(
            @PathVariable Long id,
            @RequestParam LocalDate date) {

        return eventService.getSlots(id, date);
    }
}