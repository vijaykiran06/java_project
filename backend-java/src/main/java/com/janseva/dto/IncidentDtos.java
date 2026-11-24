package com.janseva.dto;

import com.janseva.entity.Incident;
import java.util.List;

public final class IncidentDtos {

    private IncidentDtos() {}

    public record IncidentListResponse(List<Incident> incidents) {}

    public record ClusterResponse(String message, List<Incident> incidents) {}
}
