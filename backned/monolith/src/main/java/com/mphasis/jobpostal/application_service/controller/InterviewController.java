package com.mphasis.jobpostal.application_service.controller;

import com.mphasis.jobpostal.application_service.dto.InterviewRequest;
import com.mphasis.jobpostal.application_service.entity.Interview;
import com.mphasis.jobpostal.application_service.service.InterviewService;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import com.mphasis.hiringtracker.config.AuthContext;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/interviews")
public class InterviewController {

    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    // ✅ Schedule Interview
    @PostMapping
    public Interview schedule(@Valid @RequestBody InterviewRequest request, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.schedule(request);
    }

    // ✅ Get all interviews for an application
    @GetMapping("/application/{applicationId}")
    public List<Interview> getByApplication(@PathVariable Long applicationId, HttpServletRequest httpRequest) {
        AuthContext.requireUserId(httpRequest);
        return service.getByApplication(applicationId);
    }

    // ✅ Get interview by ID
    @GetMapping("/{id}")
    public Interview getById(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireUserId(httpRequest);
        return service.getById(id);
    }

    // ✅ Add feedback (NO rating) - Interview stays in PENDING_DECISION
    @PutMapping("/{id}/feedback")
    public Interview addFeedback(
            @PathVariable Long id,
            @RequestParam String feedback, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.addFeedback(id, feedback);
    }

    // ✅ Company decides to OFFER the candidate
    @PutMapping("/{id}/offer")
    public Interview offerCandidate(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.offerCandidate(id);
    }

    // ✅ Company decides to REJECT the candidate
    @PutMapping("/{id}/reject")
    public Interview rejectCandidate(
            @PathVariable Long id,
            @RequestParam(required = false) String reason, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.rejectCandidate(id, reason);
    }

    // ✅ Cancel interview
    @DeleteMapping("/{id}")
    public void cancelInterview(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        service.cancelInterview(id);
    }
    @PutMapping("/{id}/complete")
    public Interview completeInterview(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.completeInterview(id);
    }
}
