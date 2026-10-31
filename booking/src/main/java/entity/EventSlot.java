package com.example.tickethub.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "event_slots")
public class EventSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    private LocalDate date;
    private String time;

    public EventSlot() {}

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public LocalDate getDate() { return date; }
    public String getTime() { return time; }

    public void setEvent(Event event) { this.event = event; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setTime(String time) { this.time = time; }
}