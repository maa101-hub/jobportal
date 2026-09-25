package com.mphasis.jobportal.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.userservice.dto.CandidateSignupRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.service.CandidateService;

@RestController
@RequestMapping("/users")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;

    // Candidate Signup
    @PostMapping("/signup")
    public String signup(@RequestBody CandidateSignupRequest request) {
        return candidateService.signup(request);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    return ResponseEntity.ok(candidateService.login(request));
     }
}