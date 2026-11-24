package com.janseva.service;

import com.janseva.entity.Escalation;
import com.janseva.entity.Grievance;
import com.janseva.entity.GrievanceStatusHistory;
import com.janseva.entity.User;
import com.janseva.repository.EscalationRepository;
import com.janseva.repository.GrievanceRepository;
import com.janseva.repository.GrievanceStatusHistoryRepository;
import com.janseva.repository.UserRepository;
import com.janseva.util.DomainConstants;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlaService {

    private static final Logger log = LoggerFactory.getLogger(SlaService.class);

    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final EscalationRepository escalationRepository;
    private final GrievanceStatusHistoryRepository historyRepository;
    private final boolean schedulerEnabled;

    public SlaService(
            GrievanceRepository grievanceRepository,
            UserRepository userRepository,
            EscalationRepository escalationRepository,
            GrievanceStatusHistoryRepository historyRepository,
            @Value("${janseva.sla.scheduler-enabled:true}") boolean schedulerEnabled) {
        this.grievanceRepository = grievanceRepository;
        this.userRepository = userRepository;
        this.escalationRepository = escalationRepository;
        this.historyRepository = historyRepository;
        this.schedulerEnabled = schedulerEnabled;
    }

    @Transactional
    public String setSLAForGrievance(Long grievanceId, String priority) {
        int hours = DomainConstants.DEFAULT_SLA_HOURS.getOrDefault(
                priority != null ? priority : "MEDIUM", 48);
        String deadline = Instant.now().plus(hours, ChronoUnit.HOURS).toString();

        grievanceRepository.findById(grievanceId).ifPresent(g -> {
            g.setSlaDeadline(deadline);
            grievanceRepository.save(g);
        });
        return deadline;
    }

    @Scheduled(fixedDelayString = "${janseva.sla.poll-interval-ms:30000}")
    public void scheduledSlaMonitor() {
        if (!schedulerEnabled) {
            return;
        }
        try {
            processSLAEscalations();
        } catch (Exception ex) {
            log.error("SLA Worker Error: {}", ex.getMessage());
        }
    }

    @Transactional
    public int processSLAEscalations() {
        String nowIso = Instant.now().toString();
        List<Grievance> breached = grievanceRepository.findSlaBreached(nowIso);
        if (breached.isEmpty()) {
            return 0;
        }

        Long escOfficerId = userRepository
                .findFirstByRoleInOrderByIdAsc(List.of("DEPARTMENT_ADMIN", "SUPER_ADMIN"))
                .map(User::getId)
                .orElse(null);

        for (Grievance g : breached) {
            int nextLevel = (g.getEscalationLevel() != null ? g.getEscalationLevel() : 0) + 1;
            String prevStatus = g.getStatus();

            g.setIsEscalated(1);
            g.setEscalationLevel(nextLevel);
            g.setStatus("ESCALATED");
            grievanceRepository.save(g);

            Escalation esc = new Escalation();
            esc.setGrievanceId(g.getId());
            esc.setEscalatedFromOfficerId(g.getAssignedOfficerId());
            esc.setEscalatedToOfficerId(escOfficerId);
            esc.setReason("SLA Breach: Officer failed to resolve within allocated timeframe");
            esc.setLevel(nextLevel);
            esc.setStatus("ESCALATED");
            escalationRepository.save(esc);

            GrievanceStatusHistory hist = new GrievanceStatusHistory();
            hist.setGrievanceId(g.getId());
            hist.setPreviousStatus(prevStatus);
            hist.setNewStatus("ESCALATED");
            hist.setNotes("AUTOMATIC SLA BREACH ESCALATION (Level " + nextLevel + ")");
            historyRepository.save(hist);

            log.info("AUTOMATIC SLA ESCALATION: Grievance {} escalated to Level {}",
                    g.getTrackingNumber(), nextLevel);
        }

        return breached.size();
    }
}
