package com.example.tickethub.repository;

import com.example.tickethub.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByEventIdAndEventDateAndEventTime(
            Long eventId, LocalDate date, String time
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s FROM Seat s
        WHERE s.event.id = :eventId
        AND s.eventDate = :date
        AND s.eventTime = :time
        AND s.seatNumber IN :seatNumbers
    """)
    List<Seat> lockSelectedSeats(
            @Param("eventId") Long eventId,
            @Param("date") LocalDate date,
            @Param("time") String time,
            @Param("seatNumbers") List<String> seatNumbers
    );
}