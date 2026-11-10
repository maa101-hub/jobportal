package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Application apply(Long userId, Long jobId, String resumeUrl) {
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

    @Transactional
    public Application updateStatus(Long id, String status) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        app.setStatus(status);
        app.setUpdatedAt(LocalDateTime.now());

        return repository.save(app);
    }
}