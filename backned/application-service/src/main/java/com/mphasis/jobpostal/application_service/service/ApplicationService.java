package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    public Application apply(Long userId, Long jobId, String resumeUrl) {
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

    public Application updateStatus(Long id, String status) {
        Application app = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        app.setStatus(status);
        app.setUpdatedAt(LocalDateTime.now());

        return repository.save(app);
    }
}