package com.mphasis.jobportal.jobservice.repo;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mphasis.jobportal.jobservice.model.Job;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByCompanyId(Long companyId);

    List<Job> findByStatus(String status);
}
