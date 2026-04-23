package com.mphasis.jobportal.jobservice.service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mphasis.jobportal.jobservice.dto.CreateJobRequest;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.model.JobStatus;
import com.mphasis.jobportal.jobservice.repo.JobRepository;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public String createJob(CreateJobRequest request) {

        Job job = new Job();

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setTechStack(request.getTechStack());
        job.setExperience(request.getExperience());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setCompanyId(request.getCompanyId());
        job.setCreatedBy(request.getCreatedBy());

        job.setStatus(JobStatus.CREATED);
        job.setCreatedDate(LocalDate.now().toString());

        jobRepository.save(job);

        return "Job Created Successfully";
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> getCompanyJobs(Long companyId) {
        return jobRepository.findByCompanyId(companyId);
    }

    public String approveJob(Long jobId, Long approvedBy) {

        Optional<Job> optional = jobRepository.findById(jobId);

        if(optional.isEmpty()) {
            return "Job Not Found";
        }

        Job job = optional.get();

        job.setStatus(JobStatus.APPROVED);
        job.setApprovedBy(approvedBy);

        jobRepository.save(job);

        return "Job Approved Successfully";
    }

    public String closeJob(Long jobId) {

        Optional<Job> optional = jobRepository.findById(jobId);

        if(optional.isEmpty()) {
            return "Job Not Found";
        }

        Job job = optional.get();

        job.setStatus(JobStatus.CLOSED);

        jobRepository.save(job);

        return "Job Closed Successfully";
    }
}
