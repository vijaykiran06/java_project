package com.janseva.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.janseva.entity.Department;
import com.janseva.entity.GrievanceCategory;
import java.util.List;
import java.util.Map;

public final class DepartmentDtos {

    private DepartmentDtos() {}

    public record DepartmentsResponse(
            List<Department> departments,
            List<GrievanceCategory> categories,
            @JsonProperty("valid_categories") List<String> validCategories,
            @JsonProperty("category_to_department") Map<String, String> categoryToDepartment
    ) {}
}
