package com.janseva.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String error, String details) {
    public ErrorResponse(String error) {
        this(error, null);
    }
}
