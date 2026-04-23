package com.mphasis.jobportal.userservice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.mphasis.jobportal.userservice.dto.CompanyRegisterRequest;
import com.mphasis.jobportal.userservice.dto.EmployeeRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.model.CompanyEmployee;
import com.mphasis.jobportal.userservice.service.CompanyService;

@RestController
@RequestMapping("/companies")
@CrossOrigin("*")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    // Register Company
    @PostMapping("/register")
    public String register(@RequestBody CompanyRegisterRequest request) {
        return companyService.registerCompany(request);
    }

    // Company Login
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return companyService.companyLogin(request);
    }

    // Add Employee
    @PostMapping("/{companyId}/employees")
    public String addEmployee(@PathVariable Long companyId,
                              @RequestBody EmployeeRequest request) {
        return companyService.addEmployee(companyId, request);
    }

    // Get Employees
    @GetMapping("/{companyId}/employees")
    public List<CompanyEmployee> getEmployees(@PathVariable Long companyId) {
        return companyService.getEmployees(companyId);
    }

    // Delete Employee
    @DeleteMapping("/employees/{employeeId}")
    public String deleteEmployee(@PathVariable Long employeeId) {
        return companyService.deleteEmployee(employeeId);
    }
}