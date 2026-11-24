package com.janseva.service;

import com.janseva.dto.DepartmentDtos.DepartmentsResponse;
import com.janseva.entity.Department;
import com.janseva.entity.GrievanceCategory;
import com.janseva.repository.DepartmentRepository;
import com.janseva.repository.GrievanceCategoryRepository;
import com.janseva.util.DomainConstants;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final GrievanceCategoryRepository categoryRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            GrievanceCategoryRepository categoryRepository) {
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
    }

    public DepartmentsResponse getDepartmentsAndCategories() {
        List<Department> departments = departmentRepository.findAllByOrderByNameAsc();
        List<GrievanceCategory> categories = categoryRepository.findAllByOrderByNameAsc();
        return new DepartmentsResponse(
                departments,
                categories,
                DomainConstants.VALID_CATEGORIES,
                DomainConstants.CATEGORY_TO_DEPARTMENT
        );
    }
}
