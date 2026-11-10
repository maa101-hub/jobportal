package com.mphasis.jobportal.userservice.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mphasis.hiringtracker.config.JwtUtil;
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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String registerCompany(CompanyRegisterRequest request) {
        if (companyRepository.existsByEmail(request.getEmail())) throw new RuntimeException("Company Email Already Exists");

        Company company = new Company();
        company.setCompanyName(request.getCompanyName());
        company.setEmail(request.getEmail());
        company.setPassword(passwordEncoder.encode(request.getPassword()));
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

        if (!verifyCompanyPassword(request.getPassword(), company.getPassword(), company)) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        String token = jwtUtil.generateToken(
                company.getId(),
                "ADMIN",
                company.getId(),
                company.getEmail()
        );

        return new LoginResponse(
            true,
            "Login Successful",
            company.getId(),
            "ADMIN",
            company.getId(),
            company.getEmail(),
            token
        );
    }

    // company employee login
    public LoginResponse employeeLogin(LoginRequest request) {
        Optional<CompanyEmployee> optional = employeeRepository.findByEmail(request.getEmail());

        if (optional.isEmpty()) {
            return new LoginResponse(false, "Employee Not Found", null, null, null, request.getEmail());
        }

        CompanyEmployee employee = optional.get();

        if (!verifyEmployeePassword(request.getPassword(), employee.getPassword(), employee)) {
            return new LoginResponse(false, "Invalid Password", null, null, null, request.getEmail());
        }

        Long companyId = employee.getCompany() != null ? employee.getCompany().getId() : null;

        String token = jwtUtil.generateToken(
                employee.getId(),
                employee.getRole().name(),
                companyId,
                employee.getEmail()
        );

        return new LoginResponse(true,"Login Successful",
            employee.getId(),
            employee.getRole().name(),
            companyId,
            employee.getEmail(),
            token
        );
    }

    public String addEmployee(Long companyId, EmployeeRequest request) {
        Optional<Company> optional = companyRepository.findById(companyId);
        if (optional.isEmpty()) throw new RuntimeException("Company Not Found");
        if (employeeRepository.existsByEmail(request.getEmail())) throw new RuntimeException("Employee Email Already Exists");

        Company company = optional.get();

        CompanyEmployee employee = new CompanyEmployee();
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPassword(passwordEncoder.encode(request.getPassword()));
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

    // ─── Password verification with backward-compatible migration ──────────

    private boolean verifyCompanyPassword(String raw, String stored, Company company) {
        if (isBcryptEncoded(stored)) {
            return passwordEncoder.matches(raw, stored);
        }
        if (raw.equals(stored)) {
            company.setPassword(passwordEncoder.encode(raw));
            companyRepository.save(company);
            return true;
        }
        return false;
    }

    private boolean verifyEmployeePassword(String raw, String stored, CompanyEmployee employee) {
        if (isBcryptEncoded(stored)) {
            return passwordEncoder.matches(raw, stored);
        }
        if (raw.equals(stored)) {
            employee.setPassword(passwordEncoder.encode(raw));
            employeeRepository.save(employee);
            return true;
        }
        return false;
    }

    private static boolean isBcryptEncoded(String value) {
        return value != null && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}