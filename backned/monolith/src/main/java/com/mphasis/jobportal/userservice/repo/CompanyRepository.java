package com.mphasis.jobportal.userservice.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.mphasis.jobportal.userservice.model.Company;
import com.mphasis.jobportal.userservice.model.CompanyEmployee;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByEmail(String email);

    boolean existsByEmail(String email);
}