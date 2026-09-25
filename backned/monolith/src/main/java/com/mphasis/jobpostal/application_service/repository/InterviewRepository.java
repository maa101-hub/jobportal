package com.mphasis.jobpostal.application_service.repository;

import com.mphasis.jobpostal.application_service.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByApplicationId(Long applicationId);
}