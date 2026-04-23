package com.mphasis.jobportal.jobservice.controller;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.jobservice.dto.CreateJobRequest;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.service.JobService;

@RestController
@RequestMapping("/jobs")
@CrossOrigin("*")
public class JobController {

    @Autowired
    private JobService jobService;

    @PostMapping
    public String createJob(@RequestBody CreateJobRequest request) {
        return jobService.createJob(request);
    }

    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    @GetMapping("/company/{companyId}")
    public List<Job> getCompanyJobs(@PathVariable Long companyId) {
        return jobService.getCompanyJobs(companyId);
    }

    @PutMapping("/{jobId}/approve/{approvedBy}")
    public String approveJob(@PathVariable Long jobId,
                             @PathVariable Long approvedBy) {
        return jobService.approveJob(jobId, approvedBy);
    }

    @PutMapping("/{jobId}/close")
    public String closeJob(@PathVariable Long jobId) {
        return jobService.closeJob(jobId);
    }
}
