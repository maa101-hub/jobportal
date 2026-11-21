package com.mphasis.jobportal.offer_service.service;

import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.repository.OfferRepository;
import com.mphasis.jobpostal.application_service.service.ApplicationService;
import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.repo.JobRepository;
import com.mphasis.hiringtracker.config.AuthContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Objects;

@Service
public class OfferService {

    private static final String OFFER_RELEASED = "OFFER_RELEASED";
    private static final String OFFERED = "OFFERED";
    private static final String ACCEPTED = "ACCEPTED";
    private static final String REJECTED = "REJECTED";
    private static final String JOINED = "JOINED";

    private final OfferRepository repository;
    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public OfferService(OfferRepository repository, ApplicationService applicationService,
                        ApplicationRepository applicationRepository, JobRepository jobRepository) {
        this.repository = repository;
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
    }

    @Transactional
    public Offer createOffer(Long applicationId, LocalDate joiningDate, Long companyId) {
        assertCompanyOwnsApplication(applicationId, companyId);

        Offer offer = repository.findByApplicationId(applicationId).orElseGet(Offer::new);
        // An offer is a one-way lifecycle. Do not silently re-release an offer
        // that the candidate has already accepted/rejected or joined.
        if (offer.getId() != null) {
            requireStatus(offer, OFFER_RELEASED, OFFERED);
        }
        offer.setApplicationId(applicationId);
        offer.setJoiningDate(joiningDate);
        offer.setOfferDate(LocalDate.now());
        offer.setStatus(OFFER_RELEASED);
        Offer saved = repository.save(offer);
        applicationService.updateStatus(applicationId, OFFERED);
        return saved;
    }

    /** Compatibility overload used by the internal interview flow and admin jobs. */
    public Offer createOffer(Long applicationId, LocalDate joiningDate) {
        return createOffer(applicationId, joiningDate, null);
    }

    public Offer getByApplication(Long applicationId, Long candidateUserId, Long companyId) {
        assertCandidateOwnsApplication(applicationId, candidateUserId);
        assertCompanyOwnsApplication(applicationId, companyId);
        return repository.findByApplicationId(applicationId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    @Transactional
    public Offer acceptOffer(Long id, Long candidateUserId) {
        Offer offer = repository.findById(Objects.requireNonNull(id, "Offer id is required"))
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCandidateOwnsApplication(offer.getApplicationId(), candidateUserId);
        requireStatus(offer, OFFER_RELEASED, OFFERED);

        offer.setStatus(ACCEPTED);
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), ACCEPTED);
        return saved;
    }

    @Transactional
    public Offer rejectOffer(Long id, Long candidateUserId, Long companyId) {
        Offer offer = repository.findById(Objects.requireNonNull(id, "Offer id is required"))
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCandidateOwnsApplication(offer.getApplicationId(), candidateUserId);
        assertCompanyOwnsApplication(offer.getApplicationId(), companyId);
        requireStatus(offer, OFFER_RELEASED, OFFERED);
        offer.setStatus(REJECTED);
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), REJECTED);
        return saved;
    }

    @Transactional
    public Offer markJoined(Long id, String joiningDate, Long companyId) {
        Offer offer = repository.findById(Objects.requireNonNull(id, "Offer id is required"))
                .orElseThrow(() -> new RuntimeException("Offer not found"));
        assertCompanyOwnsApplication(offer.getApplicationId(), companyId);
        requireStatus(offer, ACCEPTED);

        if (joiningDate != null && !joiningDate.isBlank()) {
            try {
                offer.setJoiningDate(LocalDate.parse(joiningDate));
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException("Joining date must use yyyy-MM-dd format");
            }
        }
        offer.setStatus(JOINED);
        Offer saved = repository.save(offer);
        applicationService.updateStatus(offer.getApplicationId(), JOINED);
        return saved;
    }

    private void assertCandidateOwnsApplication(Long applicationId, Long candidateUserId) {
        if (candidateUserId == null) return;
        Application app = applicationRepository.findById(
                        Objects.requireNonNull(applicationId, "Application id is required"))
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (!candidateUserId.equals(app.getUserId())) {
            throw new AuthContext.ForbiddenException("You can only access your own offer");
        }
    }

    private void assertCompanyOwnsApplication(Long applicationId, Long companyId) {
        if (companyId == null) return;
        Application app = applicationRepository.findById(
                        Objects.requireNonNull(applicationId, "Application id is required"))
                .orElseThrow(() -> new RuntimeException("Application not found"));
        Job job = jobRepository.findById(
                        Objects.requireNonNull(app.getJobId(), "Job id is required"))
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!companyId.equals(job.getCompanyId())) {
            throw new AuthContext.ForbiddenException("You cannot manage an application from another company");
        }
    }

    private void requireStatus(Offer offer, String... allowedStatuses) {
        String current = offer.getStatus() == null ? "" : offer.getStatus().toUpperCase();
        for (String allowed : allowedStatuses) {
            if (allowed.equals(current)) return;
        }
        throw new IllegalArgumentException("Offer cannot move from status " + current);
    }
}
