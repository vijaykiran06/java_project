package com.janseva.repository;

import com.janseva.entity.Incident;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findAllByOrderByCreatedAtDesc();
}
