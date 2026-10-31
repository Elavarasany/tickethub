package com.example.tickethub.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String customerEmail;
    private String customerPhone;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private com.example.tickethub.entity.Event event;

    private LocalDate eventDate;
    private String eventTime;
    private String selectedSeats;
    private int ticketQuantity;
    private double totalPrice;
    private LocalDateTime bookingTime;

    public Booking() {}

    @PrePersist
    public void setBookingTime() {
        bookingTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public com.example.tickethub.entity.Event getEvent() { return event; }
    public LocalDate getEventDate() { return eventDate; }
    public String getEventTime() { return eventTime; }
    public String getSelectedSeats() { return selectedSeats; }
    public int getTicketQuantity() { return ticketQuantity; }
    public double getTotalPrice() { return totalPrice; }
    public LocalDateTime getBookingTime() { return bookingTime; }

    public void setCustomerName(String value) { customerName = value; }
    public void setCustomerEmail(String value) { customerEmail = value; }
    public void setCustomerPhone(String value) { customerPhone = value; }
    public void setEvent(Event value) { event = value; }
    public void setEventDate(LocalDate value) { eventDate = value; }
    public void setEventTime(String value) { eventTime = value; }
    public void setSelectedSeats(String value) { selectedSeats = value; }
    public void setTicketQuantity(int value) { ticketQuantity = value; }
    public void setTotalPrice(double value) { totalPrice = value; }
}