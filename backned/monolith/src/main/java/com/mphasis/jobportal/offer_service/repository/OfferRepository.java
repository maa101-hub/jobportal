package com.mphasis.jobportal.offer_service.repository;

import com.mphasis.jobportal.offer_service.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    Optional<Offer> findByApplicationId(Long applicationId);
}