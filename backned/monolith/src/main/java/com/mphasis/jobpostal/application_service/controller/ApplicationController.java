package com.mphasis.jobpostal.application_service.controller;

import com.mphasis.jobpostal.application_service.dto.ApplicationRequest;
import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.service.ApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public Application apply(@RequestBody ApplicationRequest request) {
        return service.apply(
                request.getUserId(),
                request.getJobId(),
                request.getResumeUrl()
        );
    }

    @GetMapping("/user/{userId}")
    public List<Application> getByUser(@PathVariable Long userId) {
        return service.getByUser(userId);
    }

    @GetMapping("/job/{jobId}")
    public List<Application> getByJob(@PathVariable Long jobId) {
        return service.getByJob(jobId);
    }

    @PutMapping("/{id}/status")
    public Application updateStatus(@PathVariable Long id, @RequestParam String status) {
        return service.updateStatus(id, status);
    }
}