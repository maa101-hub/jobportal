package com.mphasis.jobpostal.application_service.dto;

import java.util.List;

public record MatchAnalysisResponse(
        int score,
        List<String> matchedSkills,
        List<String> missingSkills,
        String summary
) {}
