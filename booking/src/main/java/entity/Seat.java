package com.example.tickethub.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "seats",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"event_id", "event_date", "event_time", "seat_number"}
        )
)
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "event_time")
    private String eventTime;

    @Column(name = "seat_number")
    private String seatNumber;

    private double price;
    private boolean booked;

    public Seat() {}

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public LocalDate getEventDate() { return eventDate; }
    public String getEventTime() { return eventTime; }
    public String getSeatNumber() { return seatNumber; }
    public double getPrice() { return price; }
    public boolean isBooked() { return booked; }

    public void setEvent(Event value) { event = value; }
    public void setEventDate(LocalDate value) { eventDate = value; }
    public void setEventTime(String value) { eventTime = value; }
    public void setSeatNumber(String value) { seatNumber = value; }
    public void setPrice(double value) { price = value; }
    public void setBooked(boolean value) { booked = value; }
}