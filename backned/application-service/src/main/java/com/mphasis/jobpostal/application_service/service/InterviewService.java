package com.mphasis.jobpostal.application_service.service;

import com.mphasis.jobpostal.application_service.entity.Interview;
import com.mphasis.jobpostal.application_service.repository.InterviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository repository;

    public InterviewService(InterviewRepository repository) {
        this.repository = repository;
    }

    public Interview schedule(Interview interview) {
        interview.setStatus("SCHEDULED");
        return repository.save(interview);
    }

    public List<Interview> getByApplication(Long appId) {
        return repository.findByApplicationId(appId);
    }

    public Interview addFeedback(Long id, String feedback) {
        Interview interview = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        interview.setFeedback(feedback);
        interview.setStatus("COMPLETED");

        return repository.save(interview);
    }
}