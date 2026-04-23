package com.mphasis.jobportal.userservice.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mphasis.jobportal.userservice.dto.CompanyRegisterRequest;
import com.mphasis.jobportal.userservice.dto.EmployeeRequest;
import com.mphasis.jobportal.userservice.dto.LoginRequest;
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

        if(companyRepository.existsByEmail(request.getEmail())) {
            return "Company Email Already Exists";
        }

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

    public String companyLogin(LoginRequest request) {

        Optional<Company> optional = companyRepository.findByEmail(request.getEmail());

        if(optional.isEmpty()) {
            return "Company Not Found";
        }

        Company company = optional.get();

        if(company.getPassword().equals(request.getPassword())) {
            return "Login Successful";
        }

        return "Invalid Password";
    }

    public String addEmployee(Long companyId, EmployeeRequest request) {

        Optional<Company> optional = companyRepository.findById(companyId);

        if(optional.isEmpty()) {
            return "Company Not Found";
        }

        if(employeeRepository.existsByEmail(request.getEmail())) {
            return "Employee Email Already Exists";
        }

        Company company = optional.get();

        CompanyEmployee employee = new CompanyEmployee();

        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPassword(request.getPassword());
        employee.setStatus("ACTIVE");
        employee.setCompany(company);

        employee.setRole(Role.valueOf(request.getRole()));

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