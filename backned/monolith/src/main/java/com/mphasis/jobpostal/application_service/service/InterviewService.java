package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.dto.InterviewRequest;
import com.mphasis.jobpostal.application_service.entity.Interview;
import com.mphasis.jobpostal.application_service.repository.InterviewRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository repository;
    private final ApplicationService applicationService;

    public InterviewService(InterviewRepository repository, ApplicationService applicationService) {
        this.repository = repository;
        this.applicationService = applicationService;
    }

    // ✅ Schedule Interview
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
            System.err.println("Error updating application status: " + e.getMessage());
        }

        return saved;
    }

    // ✅ Get all interviews for an application
    public List<Interview> getByApplication(Long appId) {
        return repository.findByApplicationId(appId);
    }

    // ✅ Get interview by ID
    public Interview getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with ID: " + id));
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
    public Interview offerCandidate(Long id) {
        Interview interview = getById(id);
        interview.setStatus("COMPLETED");
        interview.setDecision("OFFER");  // Add decision field

        Interview saved = repository.save(interview);

        // 🔄 Update application status to OFFERED
        try {
            applicationService.updateStatus(
                    interview.getApplicationId(),
                    "OFFERED"
            );
        } catch (Exception e) {
            System.err.println("Error updating application status: " + e.getMessage());
        }

        return saved;
    }

    // ✅ Company decides to REJECT the candidate
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
            System.err.println("Error updating application status: " + e.getMessage());
        }

        return saved;
    }

    // ✅ Cancel interview
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
            System.err.println("Error reverting application status: " + e.getMessage());
        }
    }
    public Interview completeInterview(Long id) {
        Interview interview = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        // Keep simple: scheduled -> completed
        interview.setStatus("COMPLETED");

        // Optional: if you want immediate admin decision state
        // interview.setStatus("PENDING_DECISION");

        return repository.save(interview);
    }
}