package com.janseva.repository;

import com.janseva.entity.IncidentGrievance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentGrievanceRepository extends JpaRepository<IncidentGrievance, Long> {
    boolean existsByIncidentIdAndGrievanceId(Long incidentId, Long grievanceId);
}
