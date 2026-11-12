package com.mphasis.jobportal.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.userservice.dto.CandidateSignupRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.model.Candidate;
import com.mphasis.jobportal.userservice.service.CandidateService;
import com.mphasis.hiringtracker.config.AuthContext;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/users")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;

    // Candidate Signup
    @PostMapping("/signup")
    public String signup(@Valid @RequestBody CandidateSignupRequest request) {
        return candidateService.signup(request);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(candidateService.login(request));
     }

    // Get candidate by ID
    @GetMapping("/{id}")
    public Candidate getById(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        String role = String.valueOf(request.getAttribute(com.mphasis.hiringtracker.config.JwtAuthFilter.AUTH_ROLE));
        if ("CANDIDATE".equals(role) && !id.equals(AuthContext.requireUserId(request))) {
            throw new AuthContext.ForbiddenException("You cannot access another candidate's profile");
        }
        AuthContext.requireRole(request, "CANDIDATE", "DELIVERY", "TFG", "TAG", "ADMIN");
        return candidateService.getById(id);
    }

    // Get all candidates
    @GetMapping
    public List<Candidate> getAll(jakarta.servlet.http.HttpServletRequest request) {
        AuthContext.requireRole(request, "DELIVERY", "TFG", "TAG", "ADMIN");
        return candidateService.getAll();
    }
}
