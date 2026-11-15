package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.dto.InterviewRequest;
import com.mphasis.jobpostal.application_service.entity.Interview;
import com.mphasis.jobpostal.application_service.repository.InterviewRepository;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import com.mphasis.hiringtracker.config.AuthContext;
import com.mphasis.jobportal.offer_service.service.OfferService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewRepository repository;
    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final OfferService offerService;

    public InterviewService(InterviewRepository repository, ApplicationService applicationService,
                            ApplicationRepository applicationRepository, OfferService offerService) {
        this.repository = repository;
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
        this.offerService = offerService;
    }

    // ✅ Schedule Interview
    @Transactional
    public Interview schedule(InterviewRequest request) {
        Interview interview = new Interview();
        interview.setApplicationId(request.getApplicationId());
        interview.setRound(request.getRound());
        interview.setScheduledAt(request.getScheduledAt());
        interview.setStatus("SCHEDULED");
        interview.setCreatedAt(LocalDateTime.now());

        Interview saved = repository.save(interview);

        // 🔄 Update application status
        try {
            applicationService.updateStatus(
                    request.getApplicationId(),
                    "INTERVIEW_SCHEDULED"
            );
        } catch (Exception e) {
            log.error("Error updating application status: {}", e.getMessage());
        }

        return saved;
    }

    // ✅ Get all interviews for an application
    public List<Interview> getByApplication(Long appId) {
        return repository.findByApplicationId(appId);
    }

    public List<Interview> getByApplication(Long appId, Long candidateUserId) {
        assertCandidateOwnsApplication(appId, candidateUserId);
        return getByApplication(appId);
    }

    // ✅ Get interview by ID
    public Interview getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with ID: " + id));
    }

    public Interview getById(Long id, Long candidateUserId) {
        Interview interview = getById(id);
        assertCandidateOwnsApplication(interview.getApplicationId(), candidateUserId);
        return interview;
    }

    private void assertCandidateOwnsApplication(Long applicationId, Long candidateUserId) {
        if (candidateUserId == null) return;
        Long applicationUserId = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"))
                .getUserId();
        if (!candidateUserId.equals(applicationUserId)) {
            throw new AuthContext.ForbiddenException("You can only access your own interview");
        }
    }

    // ✅ Add feedback only (NO rating decision)
    public Interview addFeedback(Long id, String feedback) {
        Interview interview = getById(id);
        interview.setFeedback(feedback);
        interview.setStatus("PENDING_DECISION");  // Waiting for company decision
        interview.setCompletedAt(LocalDateTime.now());

        return repository.save(interview);
    }

    // ✅ Company decides to OFFER the candidate
    @Transactional
    public Interview offerCandidate(Long id) {
        Interview interview = getById(id);
        interview.setStatus("COMPLETED");
        interview.setDecision("OFFER");  // Add decision field

        Interview saved = repository.save(interview);

        // 🔄 Update application status to OFFERED
        try {
            offerService.createOffer(interview.getApplicationId(), null);
        } catch (Exception e) {
            log.error("Error updating application status: {}", e.getMessage());
        }

        return saved;
    }

    // ✅ Company decides to REJECT the candidate
    @Transactional
    public Interview rejectCandidate(Long id, String reason) {
        Interview interview = getById(id);
        interview.setStatus("COMPLETED");
        interview.setDecision("REJECTED");  // Add decision field
        interview.setRejectionReason(reason);

        Interview saved = repository.save(interview);

        // 🔄 Update application status to REJECTED
        try {
            applicationService.updateStatus(
                    interview.getApplicationId(),
                    "REJECTED"
            );
        } catch (Exception e) {
            log.error("Error updating application status: {}", e.getMessage());
        }

        return saved;
    }

    // ✅ Cancel interview
    @Transactional
    public void cancelInterview(Long id) {
        Interview interview = getById(id);
        interview.setStatus("CANCELLED");
        interview.setCancelledAt(LocalDateTime.now());
        repository.save(interview);

        // 🔄 Revert application status
        try {
            applicationService.updateStatus(
                    interview.getApplicationId(),
                    "SHORTLISTED"
            );
        } catch (Exception e) {
            log.error("Error reverting application status: {}", e.getMessage());
        }
    }
    public Interview completeInterview(Long id, Long candidateUserId) {
        Interview interview = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if (candidateUserId != null) {
            assertCandidateOwnsApplication(interview.getApplicationId(), candidateUserId);
        }

        if (!"SCHEDULED".equalsIgnoreCase(interview.getStatus())) {
            throw new RuntimeException("This interview is not available to complete");
        }
        interview.setStatus("PENDING_DECISION");
        interview.setCompletedAt(LocalDateTime.now());

        // Optional: if you want immediate admin decision state
        // interview.setStatus("PENDING_DECISION");

        return repository.save(interview);
    }

    @Transactional
    public Interview clearInterview(Long id) {
        Interview interview = getById(id);
        if (!"PENDING_DECISION".equalsIgnoreCase(interview.getStatus())
                && !"COMPLETED".equalsIgnoreCase(interview.getStatus())) {
            throw new RuntimeException("This interview is not ready for a decision");
        }
        interview.setStatus("COMPLETED");
        interview.setDecision("CLEARED");
        Interview saved = repository.save(interview);

        String nextStatus = switch (String.valueOf(interview.getRound()).toUpperCase()) {
            case "L1" -> "L1_CLEARED";
            case "L2" -> "L2_CLEARED";
            case "R1" -> "SELECTED";
            default -> "SELECTED";
        };
        applicationService.updateStatus(interview.getApplicationId(), nextStatus);
        return saved;
    }
}
