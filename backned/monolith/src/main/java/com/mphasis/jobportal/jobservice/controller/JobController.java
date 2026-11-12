package com.mphasis.jobportal.jobservice.controller;
import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.jobservice.dto.CreateJobRequest;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.service.JobService;

import jakarta.validation.Valid;
import com.mphasis.hiringtracker.config.AuthContext;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public String createJob(@Valid @RequestBody CreateJobRequest request, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "ADMIN");
        request.setCompanyId(AuthContext.requireCompanyId(httpRequest));
        request.setCreatedBy(AuthContext.requireUserId(httpRequest));
        return jobService.createJob(request);
    }

    @GetMapping
    public List<Job> getAllJobs(HttpServletRequest httpRequest) {
        String role = String.valueOf(httpRequest.getAttribute(com.mphasis.hiringtracker.config.JwtAuthFilter.AUTH_ROLE));
        if ("CANDIDATE".equals(role)) {
            return jobService.getPublishedJobs();
        }
        AuthContext.requireRole(httpRequest, "DELIVERY", "TFG", "TAG", "ADMIN");
        return jobService.getAllJobs();
    }

    @GetMapping("/company/{companyId}")
    public List<Job> getCompanyJobs(@PathVariable Long companyId, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "TFG", "TAG", "ADMIN");
        AuthContext.requireCompany(httpRequest, companyId);
        return jobService.getCompanyJobs(companyId);
    }

    @GetMapping("/{jobId}")
    public Job getJobById(@PathVariable Long jobId) {
        return jobService.getJobById(jobId);
    }

    @PutMapping("/{jobId}")
    public String updateJob(@PathVariable Long jobId, @Valid @RequestBody CreateJobRequest request,
                            HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "ADMIN");
        request.setCompanyId(AuthContext.requireCompanyId(httpRequest));
        request.setCreatedBy(AuthContext.requireUserId(httpRequest));
        jobService.assertCompanyAccess(jobId, request.getCompanyId());
        return jobService.updateJob(jobId, request);
    }

    @DeleteMapping("/{jobId}")
    public String deleteJob(@PathVariable Long jobId, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "ADMIN");
        jobService.assertCompanyAccess(jobId, AuthContext.requireCompanyId(httpRequest));
        return jobService.deleteJob(jobId);
    }

    @PutMapping("/{jobId}/approve/{approvedBy}")
    public String approveJob(@PathVariable Long jobId, @PathVariable Long approvedBy,
                             HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TFG", "ADMIN");
        jobService.assertCompanyAccess(jobId, AuthContext.requireCompanyId(httpRequest));
        return jobService.approveJob(jobId, AuthContext.requireUserId(httpRequest));
    }

    @PutMapping("/{jobId}/close")
    public String closeJob(@PathVariable Long jobId, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "DELIVERY", "TAG", "ADMIN");
        jobService.assertCompanyAccess(jobId, AuthContext.requireCompanyId(httpRequest));
        return jobService.closeJob(jobId);
    }

    @PutMapping("/{jobId}/reject")
    public String rejectJob(@PathVariable Long jobId, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TFG", "ADMIN");
        jobService.assertCompanyAccess(jobId, AuthContext.requireCompanyId(httpRequest));
        return jobService.rejectJob(jobId);
    }
}
