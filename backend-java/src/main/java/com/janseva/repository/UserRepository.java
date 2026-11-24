package com.janseva.repository;

import com.janseva.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findFirstByRole(String role);
    Optional<User> findFirstByRoleInOrderByIdAsc(List<String> roles);

    @Query(value = """
            SELECT u.* FROM users u
            LEFT JOIN grievances g ON u.id = g.assigned_officer_id
              AND g.status IN ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS')
            WHERE u.role = 'OFFICER' AND u.department_id = :departmentId
            GROUP BY u.id
            ORDER BY COUNT(g.id) ASC
            LIMIT 1
            """, nativeQuery = true)
    Optional<User> findLeastLoadedOfficerInDepartment(@Param("departmentId") Long departmentId);
}
