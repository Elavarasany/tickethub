package com.example.tickethub.repository;

import com.example.tickethub.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByCategoryIgnoreCase(String category);
}