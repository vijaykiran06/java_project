package com.janseva.service;

import com.janseva.entity.Grievance;
import com.janseva.ml.MLDtos.DuplicateCheckRequest;
import com.janseva.ml.MLDtos.DuplicateCheckResponse;
import com.janseva.ml.MLDtos.DuplicateMatch;
import com.janseva.ml.MLDtos.GrievanceCandidate;
import com.janseva.ml.MLService;
import com.janseva.repository.GrievanceRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DuplicateService {

    private final GrievanceRepository grievanceRepository;
    private final MLService mlService;

    public DuplicateService(GrievanceRepository grievanceRepository, MLService mlService) {
        this.grievanceRepository = grievanceRepository;
        this.mlService = mlService;
    }

    public List<DuplicateMatch> findDuplicatesForGrievance(Grievance targetGrievance) {
        long excludeId = targetGrievance.getId() != null ? targetGrievance.getId() : 0L;
        List<Grievance> candidateRows = grievanceRepository.findDuplicateCandidates(excludeId);
        if (candidateRows.isEmpty()) {
            return List.of();
        }

        GrievanceCandidate targetDto = toCandidate(targetGrievance);
        List<GrievanceCandidate> candidateDtos = candidateRows.stream()
                .map(this::toCandidate)
                .toList();

        DuplicateCheckResponse res = mlService.checkDuplicates(
                new DuplicateCheckRequest(targetDto, candidateDtos));
        return res.duplicates() != null ? res.duplicates() : List.of();
    }

    private GrievanceCandidate toCandidate(Grievance g) {
        return new GrievanceCandidate(
                g.getId(),
                g.getTrackingNumber(),
                g.getCategory(),
                g.getDescription() != null ? g.getDescription() : "",
                g.getLocationText(),
                g.getLatitude(),
                g.getLongitude()
        );
    }
}
