package com.mphasis.jobportal.userservice.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mphasis.hiringtracker.config.JwtUtil;
import com.mphasis.jobportal.userservice.dto.CandidateSignupRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.model.Candidate;
import com.mphasis.jobportal.userservice.model.Role;

@Service
public class CandidateService {

    @Autowired
    private com.mphasis.jobportal.userservice.repo.CandidateRepository candidateRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String signup(CandidateSignupRequest request) {

        if(candidateRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Candidate candidate = new Candidate();
        candidate.setName(request.getName());
        candidate.setEmail(request.getEmail());
        candidate.setPassword(passwordEncoder.encode(request.getPassword()));
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

        if (!verifyPassword(request.getPassword(), candidate.getPassword(), candidate)) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        String token = jwtUtil.generateToken(
                candidate.getId(),
                candidate.getRole().name(),
                null,
                candidate.getEmail()
        );

        return new LoginResponse(
            true,
            "Login Successful",
            candidate.getId(),
            candidate.getRole().name(),
            null,
            candidate.getEmail(),
            token
        );
    }

    /**
     * Verifies the supplied raw password against the stored hash.
     *
     * <p>If the stored password is not yet a BCrypt hash (i.e. it was created
     * before hashing was introduced), falls back to a plaintext comparison
     * and then <em>re-hashes and persists</em> the password so subsequent logins
     * use the fast path. This enables zero-downtime migration of existing
     * records in the deployed database.
     */
    private boolean verifyPassword(String rawPassword, String storedPassword, Candidate candidate) {
        if (isBcryptEncoded(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        // Legacy plaintext — compare, then upgrade to BCrypt.
        if (rawPassword.equals(storedPassword)) {
            candidate.setPassword(passwordEncoder.encode(rawPassword));
            candidateRepository.save(candidate);
            return true;
        }
        return false;
    }

    /** A BCrypt hash always starts with $2a$, $2b$, or $2y$. */
    private static boolean isBcryptEncoded(String value) {
        return value != null && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }

    /** Get a candidate by ID — throws RuntimeException (404) if not found. */
    public Candidate getById(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found with ID: " + id));
    }

    /** Get all candidates. */
    public java.util.List<Candidate> getAll() {
        return candidateRepository.findAll();
    }
}