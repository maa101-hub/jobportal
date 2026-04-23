package com.mphasis.jobportal.offer_service.controller;

import com.mphasis.jobportal.offer_service.dto.OfferRequest;
import com.mphasis.jobportal.offer_service.entity.Offer;
import com.mphasis.jobportal.offer_service.service.OfferService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/offers")
public class OfferController {

    private final OfferService service;

    public OfferController(OfferService service) {
        this.service = service;
    }

    @PostMapping
    public Offer createOffer(@RequestBody OfferRequest request) {
        return service.createOffer(
                request.getApplicationId(),
                request.getJoiningDate()
        );
    }

    @GetMapping("/application/{id}")
    public Offer getByApplication(@PathVariable Long id) {
        return service.getByApplication(id);
    }

    @PutMapping("/{id}/accept")
    public Offer acceptOffer(@PathVariable Long id) {
        return service.acceptOffer(id);
    }

    @PutMapping("/{id}/join")
    public Offer markJoined(@PathVariable Long id) {
        return service.markJoined(id);
    }
}