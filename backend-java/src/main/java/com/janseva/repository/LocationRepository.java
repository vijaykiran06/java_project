package com.janseva.repository;

import com.janseva.entity.LocationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<LocationRecord, Long> {
}
