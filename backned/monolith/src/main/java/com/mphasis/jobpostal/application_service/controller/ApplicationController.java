package com.mphasis.jobpostal.application_service.controller;

import com.mphasis.jobpostal.application_service.dto.ApplicationRequest;
import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.service.ApplicationService;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import com.mphasis.hiringtracker.config.AuthContext;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public Application apply(@Valid @RequestBody ApplicationRequest request, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "CANDIDATE");
        return service.apply(
                AuthContext.requireUserId(httpRequest),
                request.getJobId(),
                request.getResumeUrl()
        );
    }

    @GetMapping("/user/{userId}")
    public List<Application> getByUser(@PathVariable Long userId, HttpServletRequest httpRequest) {
        String role = String.valueOf(httpRequest.getAttribute(com.mphasis.hiringtracker.config.JwtAuthFilter.AUTH_ROLE));
        if ("CANDIDATE".equals(role) && !userId.equals(AuthContext.requireUserId(httpRequest))) {
            throw new AuthContext.ForbiddenException("You cannot access another candidate's applications");
        }
        AuthContext.requireRole(httpRequest, "CANDIDATE", "DELIVERY", "TFG", "TAG", "ADMIN");
        return service.getByUser(userId);
    }

    @GetMapping("/job/{jobId}")
    public List<Application> getByJob(@PathVariable Long jobId, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.getByJob(jobId);
    }

    /**
     * Bulk fetch: returns all applications for the given comma-separated job IDs.
     * Eliminates the frontend N+1 where one request per job was made.
     * Usage: GET /applications/batch?jobIds=1,2,3
     */
    @GetMapping("/batch")
    public List<Application> getByJobIds(@RequestParam String jobIds, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "TFG", "TAG", "ADMIN");
        List<Long> ids = java.util.Arrays.stream(jobIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .toList();
        return service.getByJobIds(ids);
    }

    @PutMapping("/{id}/status")
    public Application updateStatus(@PathVariable Long id, @RequestParam String status, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.updateStatus(id, status);
    }
}
