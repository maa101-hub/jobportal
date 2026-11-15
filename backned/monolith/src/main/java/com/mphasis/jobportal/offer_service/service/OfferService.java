package com.mphasis.jobportal.offer_service.service;

import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.repository.OfferRepository;
import com.mphasis.jobpostal.application_service.service.ApplicationService;
import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import com.mphasis.hiringtracker.config.AuthContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class OfferService {

    private final OfferRepository repository;
    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;

    public OfferService(OfferRepository repository, ApplicationService applicationService,
                        ApplicationRepository applicationRepository) {
        this.repository = repository;
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
    }

    @Transactional
    public Offer createOffer(Long applicationId, LocalDate joiningDate) {

        Offer offer = repository.findByApplicationId(applicationId).orElseGet(Offer::new);
        offer.setApplicationId(applicationId);
        offer.setJoiningDate(joiningDate);
        offer.setOfferDate(LocalDate.now());
        offer.setStatus("OFFER_RELEASED");
        Offer saved = repository.save(offer);
        applicationService.updateStatus(applicationId, "OFFERED");
        return saved;
    }

    public Offer getByApplication(Long applicationId, Long candidateUserId) {
        assertCandidateOwnsApplication(applicationId, candidateUserId);
        return repository.findByApplicationId(applicationId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    @Transactional
    public Offer acceptOffer(Long id, Long candidateUserId) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCandidateOwnsApplication(offer.getApplicationId(), candidateUserId);

        offer.setStatus("ACCEPTED");
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), "ACCEPTED");
        return saved;
    }

 // OfferService
    @Transactional
    public Offer rejectOffer(Long id, Long candidateUserId) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCandidateOwnsApplication(offer.getApplicationId(), candidateUserId);
        offer.setStatus("REJECTED");
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), "REJECTED");
        return saved;
    }

    @Transactional
    public Offer markJoined(Long id, String joiningDate, Long candidateUserId) {
        Offer offer = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCandidateOwnsApplication(offer.getApplicationId(), candidateUserId);

        if (joiningDate != null && !joiningDate.isBlank()) {
            offer.setJoiningDate(LocalDate.parse(joiningDate));
        }
        offer.setStatus("JOINED");
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), "JOINED");
        return saved;
    }

    private void assertCandidateOwnsApplication(Long applicationId, Long candidateUserId) {
        if (candidateUserId == null) return;
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (!candidateUserId.equals(app.getUserId())) {
            throw new AuthContext.ForbiddenException("You can only access your own offer");
        }
    }
}
