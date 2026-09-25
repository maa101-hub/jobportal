package com.mphasis.jobportal.userservice.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mphasis.jobportal.userservice.dto.CandidateSignupRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.model.Candidate;
import com.mphasis.jobportal.userservice.model.Role;

@Service
public class CandidateService {

    @Autowired
    private com.mphasis.jobportal.userservice.repo.CandidateRepository candidateRepository;

    public String signup(CandidateSignupRequest request) {

        if(candidateRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        Candidate candidate = new Candidate();
        candidate.setName(request.getName());
        candidate.setEmail(request.getEmail());
        candidate.setPassword(request.getPassword());
        candidate.setRole(Role.USER);
        candidate.setStatus("ACTIVE");

        candidateRepository.save(candidate);

        return "Candidate Registered Successfully";
    }

    public LoginResponse login(LoginRequest request) {
        Optional<Candidate> optional = candidateRepository.findByEmail(request.getEmail());

        if (optional.isEmpty()) {
            return new LoginResponse(false, "User Not Found", null, null, null, request.getEmail());
        }

        Candidate candidate = optional.get();

        if (!candidate.getPassword().equals(request.getPassword())) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        return new LoginResponse(
            true,
            "Login Successful",
            candidate.getId(),
            candidate.getRole().name(), // USER
            null,                        // companyId -> candidate ke liye null
            candidate.getEmail()
        );
    }
}