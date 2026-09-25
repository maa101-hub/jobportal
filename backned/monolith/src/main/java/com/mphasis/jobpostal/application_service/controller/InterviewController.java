package com.mphasis.jobpostal.application_service.controller;

import com.mphasis.jobpostal.application_service.dto.InterviewRequest;
import com.mphasis.jobpostal.application_service.entity.Interview;
import com.mphasis.jobpostal.application_service.service.InterviewService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/interviews")
public class InterviewController {

    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    // ✅ Schedule Interview
    @PostMapping
    public Interview schedule(@RequestBody InterviewRequest request) {
        return service.schedule(request);
    }

    // ✅ Get all interviews for an application
    @GetMapping("/application/{applicationId}")
    public List<Interview> getByApplication(@PathVariable Long applicationId) {
        return service.getByApplication(applicationId);
    }

    // ✅ Get interview by ID
    @GetMapping("/{id}")
    public Interview getById(@PathVariable Long id) {
        return service.getById(id);
    }

    // ✅ Add feedback (NO rating) - Interview stays in PENDING_DECISION
    @PutMapping("/{id}/feedback")
    public Interview addFeedback(
            @PathVariable Long id,
            @RequestParam String feedback) {
        return service.addFeedback(id, feedback);
    }

    // ✅ Company decides to OFFER the candidate
    @PutMapping("/{id}/offer")
    public Interview offerCandidate(@PathVariable Long id) {
        return service.offerCandidate(id);
    }

    // ✅ Company decides to REJECT the candidate
    @PutMapping("/{id}/reject")
    public Interview rejectCandidate(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return service.rejectCandidate(id, reason);
    }

    // ✅ Cancel interview
    @DeleteMapping("/{id}")
    public void cancelInterview(@PathVariable Long id) {
        service.cancelInterview(id);
    }
    @PutMapping("/{id}/complete")
    public Interview completeInterview(@PathVariable Long id) {
        return service.completeInterview(id);
    }
}