package com.janseva.repository;

import com.janseva.entity.Grievance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    Optional<Grievance> findByTrackingNumber(String trackingNumber);

    List<Grievance> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    List<Grievance> findAllByOrderByCreatedAtDesc();

    List<Grievance> findByIncidentIdIsNullOrderByCreatedAtDesc();

    @Query("""
            SELECT g FROM Grievance g
            WHERE g.assignedOfficerId = :officerId
               OR (:departmentName IS NOT NULL AND g.department = :departmentName)
            ORDER BY g.createdAt DESC
            """)
    List<Grievance> findForOfficer(
            @Param("officerId") Long officerId,
            @Param("departmentName") String departmentName);

    @Query("""
            SELECT g FROM Grievance g
            WHERE g.slaDeadline IS NOT NULL
              AND g.slaDeadline < :nowIso
              AND g.status NOT IN ('RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED', 'REJECTED')
              AND g.isEscalated = 0
            """)
    List<Grievance> findSlaBreached(@Param("nowIso") String nowIso);

    @Query(value = """
            SELECT * FROM grievances
            WHERE id != :excludeId
              AND status NOT IN ('CLOSED', 'REJECTED')
            ORDER BY created_at DESC
            LIMIT 100
            """, nativeQuery = true)
    List<Grievance> findDuplicateCandidates(@Param("excludeId") Long excludeId);

    long countByStatusIn(List<String> statuses);

    @Query("SELECT COUNT(g) FROM Grievance g WHERE g.isEscalated = 1 OR g.status = 'ESCALATED'")
    long countEscalated();

    @Query("SELECT g.category, COUNT(g) FROM Grievance g GROUP BY g.category ORDER BY COUNT(g) DESC")
    List<Object[]> countByCategoryGrouped();

    @Query("SELECT g.department, COUNT(g) FROM Grievance g GROUP BY g.department ORDER BY COUNT(g) DESC")
    List<Object[]> countByDepartmentGrouped();
}
