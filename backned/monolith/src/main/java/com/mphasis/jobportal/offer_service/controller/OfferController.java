package com.mphasis.jobportal.offer_service.controller;

import com.mphasis.jobportal.offer_service.dto.OfferRequest;
import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.service.OfferService;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import com.mphasis.hiringtracker.config.AuthContext;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/offers")
public class OfferController {

    private final OfferService service;

    public OfferController(OfferService service) {
        this.service = service;
    }

    @PostMapping
    public Offer createOffer(@Valid @RequestBody OfferRequest request, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "TAG", "ADMIN");
        return service.createOffer(
                request.getApplicationId(),
                request.getJoiningDate()
        );
    }

    @GetMapping("/application/{id}")
    public Offer getByApplication(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireUserId(httpRequest);
        return service.getByApplication(id);
    }

    @PutMapping("/{id}/accept")
    public Offer acceptOffer(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "CANDIDATE");
        return service.acceptOffer(id);
    }
 // OfferController
    @PutMapping("/{id}/reject")
    public Offer rejectOffer(@PathVariable Long id, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "CANDIDATE", "TAG", "ADMIN");
        return service.rejectOffer(id);
    }

    @PutMapping("/{id}/join")
    public Offer markJoined(
            @PathVariable Long id,
            @RequestParam(required = false) String joiningDate, HttpServletRequest httpRequest) {
        AuthContext.requireRole(httpRequest, "CANDIDATE", "TAG", "ADMIN");
        return service.markJoined(id, joiningDate);
    }
}
