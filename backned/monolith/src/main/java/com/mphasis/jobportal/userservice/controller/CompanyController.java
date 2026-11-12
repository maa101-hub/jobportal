package com.mphasis.jobportal.userservice.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.userservice.dto.CompanyRegisterRequest;
import com.mphasis.jobportal.userservice.dto.EmployeeRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.model.CompanyEmployee;
import com.mphasis.jobportal.userservice.service.CompanyService;
import com.mphasis.hiringtracker.config.AuthContext;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @PostMapping("/register")
    public String register(@Valid @RequestBody CompanyRegisterRequest request) {
        return companyService.registerCompany(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return companyService.companyLogin(request);
    }

    // NEW: employee login (DELIVERY/TFG/TAG/ADMIN employees)
    @PostMapping("/employees/login")
    public LoginResponse employeeLogin(@Valid @RequestBody LoginRequest request) {
        return companyService.employeeLogin(request);
    }

    @PostMapping("/{companyId}/employees")
    public String addEmployee(@PathVariable Long companyId, @Valid @RequestBody EmployeeRequest request,
                              jakarta.servlet.http.HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "ADMIN");
        AuthContext.requireCompany(httpRequest, companyId);
        return companyService.addEmployee(companyId, request);
    }

    @GetMapping("/{companyId}/employees")
    public List<CompanyEmployee> getEmployees(@PathVariable Long companyId,
                                              jakarta.servlet.http.HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "ADMIN", "DELIVERY", "TFG", "TAG");
        AuthContext.requireCompany(httpRequest, companyId);
        return companyService.getEmployees(companyId);
    }

    @DeleteMapping("/employees/{employeeId}")
    public String deleteEmployee(@PathVariable Long employeeId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "ADMIN");
        return companyService.deleteEmployee(employeeId, AuthContext.requireCompanyId(httpRequest));
    }
}
