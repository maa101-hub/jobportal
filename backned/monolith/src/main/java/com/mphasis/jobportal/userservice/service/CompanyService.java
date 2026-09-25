package com.mphasis.jobportal.userservice.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mphasis.jobportal.userservice.dto.CompanyRegisterRequest;
import com.mphasis.jobportal.userservice.dto.EmployeeRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
import com.mphasis.jobportal.userservice.dto.LoginResponse;
import com.mphasis.jobportal.userservice.model.Company;
import com.mphasis.jobportal.userservice.model.CompanyEmployee;
import com.mphasis.jobportal.userservice.model.Role;
import com.mphasis.jobportal.userservice.repo.CompanyEmployeeRepository;
import com.mphasis.jobportal.userservice.repo.CompanyRepository;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CompanyEmployeeRepository employeeRepository;

    public String registerCompany(CompanyRegisterRequest request) {
        if (companyRepository.existsByEmail(request.getEmail())) return "Company Email Already Exists";

        Company company = new Company();
        company.setCompanyName(request.getCompanyName());
        company.setEmail(request.getEmail());
        company.setPassword(request.getPassword());
        company.setLocation(request.getLocation());
        company.setDescription(request.getDescription());
        company.setStatus("ACTIVE");

        companyRepository.save(company);
        return "Company Registered Successfully";
    }

    public LoginResponse companyLogin(LoginRequest request) {
        Optional<Company> optional = companyRepository.findByEmail(request.getEmail());

        if (optional.isEmpty()) {
            return new LoginResponse(false, "Company Not Found", null, null, null, request.getEmail());
        }

        Company company = optional.get();

        if (!company.getPassword().equals(request.getPassword())) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        // Company owner/admin login
        return new LoginResponse(
            true,
            "Login Successful",
            company.getId(),     // userId
            "ADMIN",             // role for company owner
            company.getId(),     // companyId
            company.getEmail()
        );
    }

    // NEW: company employee login
    public LoginResponse employeeLogin(LoginRequest request) {
        Optional<CompanyEmployee> optional = employeeRepository.findByEmail(request.getEmail());

        if (optional.isEmpty()) {
            return new LoginResponse(false, "Employee Not Found", null, null, null, request.getEmail());
        }

        CompanyEmployee employee = optional.get();

        if (!employee.getPassword().equals(request.getPassword())) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        Long companyId = employee.getCompany() != null ? employee.getCompany().getId() : null;

        return new LoginResponse(true,"Login Successful",
            employee.getId(),
            employee.getRole().name(), // DELIVERY/TFG/TAG/ADMIN
            companyId,
            employee.getEmail()
        );
    }

    public String addEmployee(Long companyId, EmployeeRequest request) {
        Optional<Company> optional = companyRepository.findById(companyId);
        if (optional.isEmpty()) return "Company Not Found";
        if (employeeRepository.existsByEmail(request.getEmail())) return "Employee Email Already Exists";

        Company company = optional.get();

        CompanyEmployee employee = new CompanyEmployee();
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPassword(request.getPassword());
        employee.setStatus(request.getStatus() != null && !request.getStatus().isBlank()
                ? request.getStatus() : "ACTIVE");
        employee.setCompany(company);
        employee.setRole(Role.valueOf(request.getRole()));
        employee.setPhone(request.getPhone());
        employee.setDepartment(request.getDepartment());
        employee.setLocation(request.getLocation());
        employee.setEmployeeId(request.getEmployeeId());

        employeeRepository.save(employee);
        return "Employee Added Successfully";
    }

    public List<CompanyEmployee> getEmployees(Long companyId) {
        return employeeRepository.findByCompanyId(companyId);
    }

    public String deleteEmployee(Long employeeId) {
        employeeRepository.deleteById(employeeId);
        return "Employee Deleted Successfully";
    }
}