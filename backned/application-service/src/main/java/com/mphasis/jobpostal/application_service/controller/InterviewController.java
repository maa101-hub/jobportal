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

    @PostMapping
    public Interview schedule(@RequestBody InterviewRequest request) {
        Interview interview = new Interview();
        interview.setApplicationId(request.getApplicationId());
        interview.setRound(request.getRound());
        interview.setScheduledAt(request.getScheduledAt());

        return service.schedule(interview);
    }

    @GetMapping("/application/{id}")
    public List<Interview> getByApplication(@PathVariable Long id) {
        return service.getByApplication(id);
    }

    @PutMapping("/{id}/feedback")
    public Interview addFeedback(@PathVariable Long id, @RequestParam String feedback) {
        return service.addFeedback(id, feedback);
    }
}