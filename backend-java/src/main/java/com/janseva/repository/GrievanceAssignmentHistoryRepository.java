package com.janseva.repository;

import com.janseva.entity.GrievanceAssignmentHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrievanceAssignmentHistoryRepository extends JpaRepository<GrievanceAssignmentHistory, Long> {
    List<GrievanceAssignmentHistory> findByGrievanceIdOrderByCreatedAtDesc(Long grievanceId);
}
