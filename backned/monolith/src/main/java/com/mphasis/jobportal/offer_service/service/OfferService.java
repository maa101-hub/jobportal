package com.mphasis.jobportal.offer_service.service;

import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.repository.OfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class OfferService {

    private final OfferRepository repository;

    public OfferService(OfferRepository repository) {
        this.repository = repository;
    }

    @Transactional
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

    @Transactional
    public Offer acceptOffer(Long id) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        offer.setStatus("ACCEPTED");
        return repository.save(offer);
    }

 // OfferService
    @Transactional
    public Offer rejectOffer(Long id) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        offer.setStatus("REJECTED");
        return repository.save(offer);
    }

    @Transactional
    public Offer markJoined(Long id, String joiningDate) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        if (joiningDate != null && !joiningDate.isBlank()) {
            offer.setJoiningDate(LocalDate.parse(joiningDate));
        }
        offer.setStatus("JOINED");
        return repository.save(offer);
    }
}