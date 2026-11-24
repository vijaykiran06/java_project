package com.janseva.repository;

import com.janseva.entity.GrievanceStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrievanceStatusHistoryRepository extends JpaRepository<GrievanceStatusHistory, Long> {
    List<GrievanceStatusHistory> findByGrievanceIdOrderByCreatedAtAsc(Long grievanceId);
}
