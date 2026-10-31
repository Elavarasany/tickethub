package com.example.tickethub.repository;

import com.example.tickethub.entity.EventSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EventSlotRepository extends JpaRepository<EventSlot, Long> {

    List<EventSlot> findByEventIdAndDate(Long eventId, LocalDate date);

    @Query("""
        SELECT DISTINCT s.date
        FROM EventSlot s
        WHERE s.event.id = :eventId
        ORDER BY s.date
    """)
    List<LocalDate> findAvailableDates(@Param("eventId") Long eventId);
}