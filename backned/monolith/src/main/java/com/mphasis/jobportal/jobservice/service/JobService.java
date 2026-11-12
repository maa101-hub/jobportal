package com.mphasis.jobportal.jobservice.service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mphasis.jobportal.jobservice.dto.CreateJobRequest;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.model.JobStatus;
import com.mphasis.jobportal.jobservice.repo.JobRepository;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Transactional
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

        job.setOpenings(request.getOpenings());
        job.setDeadline(request.getDeadline());
        job.setResponsibilities(request.getResponsibilities());
        job.setRequirements(request.getRequirements());
        job.setAssignedTag(request.getAssignedTag());

        job.setStatus(JobStatus.CREATED);
        job.setCreatedDate(LocalDate.now().toString());

        jobRepository.save(job);

        return "Job Created Successfully";
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> getPublishedJobs() {
        return jobRepository.findByStatusIn(List.of(JobStatus.APPROVED, JobStatus.OPEN));
    }

    public Job getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with ID: " + jobId));
    }

    public List<Job> getCompanyJobs(Long companyId) {
        return jobRepository.findByCompanyId(companyId);
    }

    public void assertCompanyAccess(Long jobId, Long companyId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job Not Found"));
        if (!companyId.equals(job.getCompanyId())) {
            throw new com.mphasis.hiringtracker.config.AuthContext.ForbiddenException(
                    "You cannot access a job from another company");
        }
    }

    public String approveJob(Long jobId, Long approvedBy) {

        Optional<Job> optional = jobRepository.findById(jobId);

        if(optional.isEmpty()) {
            throw new RuntimeException("Job Not Found");
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
            throw new RuntimeException("Job Not Found");
        }

        Job job = optional.get();

        job.setStatus(JobStatus.CLOSED);

        jobRepository.save(job);

        return "Job Closed Successfully";
    }

    // TFG can reject a job (or request changes). Both move it out of the review
    // queue; REJECTED is the terminal state, "changes requested" reuses it too.
    public String rejectJob(Long jobId) {

        Optional<Job> optional = jobRepository.findById(jobId);

        if (optional.isEmpty()) {
            throw new RuntimeException("Job Not Found");
        }

        Job job = optional.get();
        job.setStatus(JobStatus.REJECTED);
        jobRepository.save(job);

        return "Job Rejected Successfully";
    }

    @Transactional
    public String updateJob(Long jobId, CreateJobRequest request) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with ID: " + jobId));

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setTechStack(request.getTechStack());
        job.setExperience(request.getExperience());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setOpenings(request.getOpenings());
        job.setDeadline(request.getDeadline());
        job.setResponsibilities(request.getResponsibilities());
        job.setRequirements(request.getRequirements());
        job.setAssignedTag(request.getAssignedTag());

        jobRepository.save(job);
        return "Job Updated Successfully";
    }

    @Transactional
    public String deleteJob(Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new RuntimeException("Job Not Found");
        }
        jobRepository.deleteById(jobId);
        return "Job Deleted Successfully";
    }
}
