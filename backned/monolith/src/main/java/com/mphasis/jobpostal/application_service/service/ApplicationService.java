package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.model.JobStatus;
import com.mphasis.jobportal.jobservice.repo.JobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;
    private final JobRepository jobRepository;

    public ApplicationService(ApplicationRepository repository, JobRepository jobRepository) {
        this.repository = repository;
        this.jobRepository = jobRepository;
    }

    @Transactional
    public Application apply(Long userId, Long jobId, String resumeUrl) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!(job.getStatus() == JobStatus.APPROVED || job.getStatus() == JobStatus.OPEN)) {
            throw new RuntimeException("This job is not open for applications");
        }
        // Prevent duplicate applications — a user can only apply to a job once.
        if (repository.existsByUserIdAndJobId(userId, jobId)) {
            throw new RuntimeException("You have already applied for this job");
        }

        Application app = new Application();
        app.setUserId(userId);
        app.setJobId(jobId);
        app.setResumeUrl(resumeUrl);
        app.setStatus("APPLIED");
        app.setAppliedAt(LocalDateTime.now());
        app.setUpdatedAt(LocalDateTime.now());

        return repository.save(app);
    }

    public List<Application> getByUser(Long userId) {
        return repository.findByUserId(userId);
    }

    public List<Application> getByJob(Long jobId) {
        return repository.findByJobId(jobId);
    }

    public List<Application> getByJob(Long jobId, Long companyId) {
        assertJobCompany(jobId, companyId);
        return getByJob(jobId);
    }

    /**
     * Fetches all applications for a batch of job IDs in a single query,
     * eliminating the N+1 problem where the frontend dashboard made one
     * request per job.
     */
    public List<Application> getByJobIds(List<Long> jobIds) {
        if (jobIds == null || jobIds.isEmpty()) {
            return List.of();
        }
        return repository.findByJobIdIn(jobIds);
    }

    public List<Application> getByJobIds(List<Long> jobIds, Long companyId) {
        jobIds.forEach(jobId -> assertJobCompany(jobId, companyId));
        return getByJobIds(jobIds);
    }

    @Transactional
    public Application updateStatus(Long id, String status) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        assertJobCompany(app.getJobId(), null);

        app.setStatus(status);
        app.setUpdatedAt(LocalDateTime.now());

        return repository.save(app);
    }

    public Application updateStatus(Long id, String status, Long companyId) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        assertJobCompany(app.getJobId(), companyId);
        app.setStatus(status);
        app.setUpdatedAt(LocalDateTime.now());
        return repository.save(app);
    }

    private void assertJobCompany(Long jobId, Long companyId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (companyId != null && !companyId.equals(job.getCompanyId())) {
            throw new com.mphasis.hiringtracker.config.AuthContext.ForbiddenException(
                    "You cannot access an application from another company");
        }
    }
}
