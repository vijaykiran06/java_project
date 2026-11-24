package com.janseva.repository;

import com.janseva.entity.GrievanceCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrievanceCategoryRepository extends JpaRepository<GrievanceCategory, Long> {
    List<GrievanceCategory> findAllByOrderByNameAsc();
}
