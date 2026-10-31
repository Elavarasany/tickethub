package com.example.tickethub.repository;

import com.example.tickethub.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerEmailIgnoreCase(String email);
}