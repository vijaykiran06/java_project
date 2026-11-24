package com.janseva.service;

import com.janseva.dto.IncidentDtos.ClusterResponse;
import com.janseva.dto.IncidentDtos.IncidentListResponse;
import com.janseva.entity.Grievance;
import com.janseva.entity.Incident;
import com.janseva.entity.IncidentGrievance;
import com.janseva.ml.MLDtos.DuplicateMatch;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.IncidentGrievanceRepository;
import com.janseva.repository.IncidentRepository;
import com.janseva.util.IdGenerator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final GrievanceRepository grievanceRepository;
    private final IncidentGrievanceRepository incidentGrievanceRepository;
    private final DuplicateService duplicateService;

    public IncidentService(
            IncidentRepository incidentRepository,
            GrievanceRepository grievanceRepository,
            IncidentGrievanceRepository incidentGrievanceRepository,
            DuplicateService duplicateService) {
        this.incidentRepository = incidentRepository;
        this.grievanceRepository = grievanceRepository;
        this.incidentGrievanceRepository = incidentGrievanceRepository;
        this.duplicateService = duplicateService;
    }

    public IncidentListResponse listIncidents() {
        return new IncidentListResponse(incidentRepository.findAllByOrderByCreatedAtDesc());
    }

    @Transactional
    public ClusterResponse clusterDuplicates() {
        List<Grievance> unclustered = grievanceRepository.findByIncidentIdIsNullOrderByCreatedAtDesc();
        int clusterCount = 0;

        for (Grievance g : unclustered) {
            List<DuplicateMatch> duplicates = duplicateService.findDuplicatesForGrievance(g);
            if (duplicates.isEmpty()) {
                continue;
            }

            DuplicateMatch topDup = duplicates.get(0);
            if (topDup.duplicateGrievanceId() == null) {
                continue;
            }

            Optional<Grievance> optDupGrv = grievanceRepository.findById(topDup.duplicateGrievanceId());
            if (optDupGrv.isEmpty()) {
                continue;
            }

            Grievance dupGrv = optDupGrv.get();
            Long incidentId = dupGrv.getIncidentId();

            if (incidentId == null) {
                Incident inc = new Incident();
                inc.setIncidentNumber(IdGenerator.generateIncidentNumber());
                inc.setTitle("Master Incident: " + g.getCategory() + " at "
                        + (g.getLocationText() != null ? g.getLocationText() : "Locality"));
                inc.setDescription(g.getDescription());
                inc.setCategory(g.getCategory());
                inc.setDepartment(g.getDepartment());
                inc.setPriority(g.getPriority());
                inc.setPrimaryLocation(g.getLocationText());
                inc.setAffectedCitizensCount(2);

                Incident savedInc = incidentRepository.save(inc);
                incidentId = savedInc.getId();
                clusterCount++;

                dupGrv.setIncidentId(incidentId);
                grievanceRepository.save(dupGrv);
                linkIncidentGrievance(incidentId, dupGrv.getId());
            } else {
                incidentRepository.findById(incidentId).ifPresent(existingInc -> {
                    int curr = existingInc.getAffectedCitizensCount() != null
                            ? existingInc.getAffectedCitizensCount() : 1;
                    existingInc.setAffectedCitizensCount(curr + 1);
                    incidentRepository.save(existingInc);
                });
            }

            g.setIncidentId(incidentId);
            g.setIsDuplicate(1);
            g.setDuplicateOfId(dupGrv.getId());
            grievanceRepository.save(g);
            linkIncidentGrievance(incidentId, g.getId());
        }

        List<Incident> incidents = incidentRepository.findAllByOrderByCreatedAtDesc();
        String msg = "Clustered duplicate grievances into incidents. Created "
                + clusterCount + " new master tickets.";
        return new ClusterResponse(msg, incidents);
    }

    private void linkIncidentGrievance(Long incidentId, Long grievanceId) {
        if (!incidentGrievanceRepository.existsByIncidentIdAndGrievanceId(incidentId, grievanceId)) {
            incidentGrievanceRepository.save(new IncidentGrievance(incidentId, grievanceId));
        }
    }
}
