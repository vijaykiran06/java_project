package com.janseva.controller;

import com.janseva.dto.DepartmentDtos.DepartmentsResponse;
import com.janseva.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<DepartmentsResponse> getAll() {
        return ResponseEntity.ok(departmentService.getDepartmentsAndCategories());
    }
}
