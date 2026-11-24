package com.janseva.service;

import com.janseva.dto.AiDtos.AdminAssistantRequest;
import com.janseva.dto.AiDtos.AdminAssistantResponse;
import com.janseva.dto.AiDtos.AdminMetrics;
import com.janseva.dto.AiDtos.CategoryCount;
import com.janseva.dto.AiDtos.DepartmentCount;
import com.janseva.dto.AiDtos.ScoredGrievanceView;
import com.janseva.dto.AiDtos.SemanticSearchRequest;
import com.janseva.dto.AiDtos.SemanticSearchResponse;
import com.janseva.entity.Grievance;
import com.janseva.exception.BadRequestException;
import com.janseva.repository.GrievanceRepository;
import com.janseva.util.DomainConstants;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AdminAnalyticsService {

    private final GrievanceRepository grievanceRepository;

    public AdminAnalyticsService(GrievanceRepository grievanceRepository) {
        this.grievanceRepository = grievanceRepository;
    }

    public AdminAssistantResponse answerAdminQuestion(AdminAssistantRequest req) {
        if (req == null || req.question() == null || req.question().trim().isEmpty()) {
            throw new BadRequestException("Question is required.");
        }

        long totalCount = grievanceRepository.count();
        long pendingCount = grievanceRepository.countByStatusIn(DomainConstants.PENDING_STATUSES);
        long resolvedCount = grievanceRepository.countByStatusIn(DomainConstants.RESOLVED_STATUSES);
        long escalatedCount = grievanceRepository.countEscalated();

        List<CategoryCount> categoryBreakdown = grievanceRepository.countByCategoryGrouped().stream()
                .map(row -> new CategoryCount(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();

        List<DepartmentCount> departmentBreakdown = grievanceRepository.countByDepartmentGrouped().stream()
                .map(row -> new DepartmentCount(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();

        AdminMetrics metrics = new AdminMetrics(
                totalCount, pendingCount, resolvedCount, escalatedCount,
                categoryBreakdown, departmentBreakdown);

        String qLower = req.question().toLowerCase();
        String answer;

        if (qLower.contains("biggest") || qLower.contains("top") || qLower.contains("category")) {
            String topCat = !categoryBreakdown.isEmpty()
                    ? categoryBreakdown.get(0).category() + " (" + categoryBreakdown.get(0).count() + " complaints)"
                    : "None";
            String catList = categoryBreakdown.stream()
                    .map(c -> "- " + c.category() + ": " + c.count())
                    .collect(Collectors.joining("\n"));
            answer = "Based on live database records, the largest grievance category is "
                    + topCat + ".\n\nCategory Distribution:\n" + catList;
        } else if (qLower.contains("unresolved") || qLower.contains("pending")) {
            answer = String.format(
                    "There are currently %d unresolved grievances pending officer action across departments out of %d total registered complaints.",
                    pendingCount, totalCount);
        } else if (qLower.contains("breach") || qLower.contains("escalat")) {
            answer = String.format(
                    "There are currently %d grievances that have breached SLA timelines and been automatically escalated to senior department officers.",
                    escalatedCount);
        } else if (qLower.contains("department")) {
            String deptList = departmentBreakdown.stream()
                    .map(d -> "- " + d.department() + ": " + d.count() + " complaints")
                    .collect(Collectors.joining("\n"));
            answer = "Departmental Breakdown:\n" + deptList;
        } else {
            answer = String.format(
                    "Executive Summary (Live Database Metrics):\n- Total Grievances: %d\n- Pending Resolution: %d\n- Resolved & Verified: %d\n- Escalated / SLA Breached: %d",
                    totalCount, pendingCount, resolvedCount, escalatedCount);
        }

        return new AdminAssistantResponse(answer, metrics);
    }

    public SemanticSearchResponse semanticSearch(SemanticSearchRequest req) {
        if (req == null || req.query() == null || req.query().trim().isEmpty()) {
            throw new BadRequestException("Query is required.");
        }

        List<String> keywords = Arrays.stream(req.query().toLowerCase().split("\\s+"))
                .filter(w -> w.length() > 2)
                .toList();

        List<Grievance> allGrievances = grievanceRepository.findAll();

        List<ScoredGrievanceView> matches = allGrievances.stream()
                .map(g -> {
                    String text = String.join(" ",
                            g.getDescription() != null ? g.getDescription() : "",
                            g.getCategory(),
                            g.getDepartment(),
                            g.getLocationText() != null ? g.getLocationText() : ""
                    ).toLowerCase();
                    int score = (int) keywords.stream().filter(text::contains).count();
                    return ScoredGrievanceView.from(g, score);
                })
                .filter(v -> v.score > 0)
                .sorted(Comparator.comparingInt((ScoredGrievanceView v) -> v.score).reversed())
                .limit(15)
                .toList();

        return new SemanticSearchResponse(req.query(), matches);
    }
}
