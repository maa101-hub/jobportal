package com.mphasis.jobportal.offer_service.service;

import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.repository.OfferRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class OfferService {

    private final OfferRepository repository;

    public OfferService(OfferRepository repository) {
        this.repository = repository;
    }

    public Offer createOffer(Long applicationId, LocalDate joiningDate) {

        Offer offer = new Offer();
        offer.setApplicationId(applicationId);
        offer.setJoiningDate(joiningDate);
        offer.setOfferDate(LocalDate.now());
        offer.setStatus("OFFER_RELEASED");

        return repository.save(offer);
    }

    public Offer getByApplication(Long applicationId) {
        return repository.findByApplicationId(applicationId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    public Offer acceptOffer(Long id) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        offer.setStatus("ACCEPTED");
        return repository.save(offer);
    }

    public Offer markJoined(Long id) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        offer.setStatus("JOINED");
        return repository.save(offer);
    }
}