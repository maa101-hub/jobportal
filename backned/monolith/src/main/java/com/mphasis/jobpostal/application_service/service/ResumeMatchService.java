package com.mphasis.jobpostal.application_service.service;

import com.mphasis.hiringtracker.config.AuthContext;
import com.mphasis.jobpostal.application_service.dto.MatchAnalysisResponse;
import com.mphasis.jobpostal.application_service.entity.Application;
import com.mphasis.jobpostal.application_service.repository.ApplicationRepository;
import com.mphasis.jobportal.jobservice.model.Job;
import com.mphasis.jobportal.jobservice.repo.JobRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class ResumeMatchService {
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^a-z0-9+#.]+", Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "from", "this", "that", "are", "was", "have",
            "has", "will", "into", "your", "our", "you", "job", "role", "years", "year",
            "experience", "work", "working", "using", "looking", "candidate"
    );
    private static final List<String> SKILLS = List.of(
            "java", "spring", "spring boot", "python", "javascript", "typescript", "react",
            "node.js", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes", "aws",
            "azure", "git", "rest api", "microservices", "machine learning", "data science",
            "html", "css", "figma", "communication", "leadership", "testing", "junit"
    );

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public ResumeMatchService(ApplicationRepository applicationRepository, JobRepository jobRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
    }

    public MatchAnalysisResponse analyze(Long applicationId, Long companyId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (companyId != null && !companyId.equals(job.getCompanyId())) {
            throw new AuthContext.ForbiddenException("You cannot analyze an application from another company");
        }

        String candidateText = join(application.getFullName(), application.getExperience(),
                application.getEducation(), application.getCoverLetter(), application.getResumeText());
        String jobText = join(job.getTitle(), job.getDescription(), job.getTechStack(),
                job.getExperience(), job.getResponsibilities(), job.getRequirements());

        Set<String> candidateTokens = tokenize(candidateText);
        Set<String> jobTokens = tokenize(jobText);
        List<String> matched = skillsInBoth(SKILLS, candidateText, jobText);
        List<String> missing = SKILLS.stream()
                .filter(skill -> containsSkill(jobText, skill) && !containsSkill(candidateText, skill))
                .limit(8)
                .toList();

        double cosine = cosineSimilarity(candidateTokens, jobTokens);
        double skillRatio = relevantSkillRatio(candidateText, jobText);
        int score = (int) Math.round(Math.min(1d, cosine * 0.65d + skillRatio * 0.35d) * 100d);
        String summary = score >= 75 ? "Strong match for this role"
                : score >= 50 ? "Promising match; review the missing skills"
                : "Limited match; review the candidate profile carefully";

        return new MatchAnalysisResponse(score, matched, missing, summary);
    }

    private List<String> skillsInBoth(List<String> skills, String candidate, String job) {
        return skills.stream()
                .filter(skill -> containsSkill(candidate, skill) && containsSkill(job, skill))
                .toList();
    }

    private double relevantSkillRatio(String candidate, String job) {
        List<String> required = SKILLS.stream().filter(skill -> containsSkill(job, skill)).toList();
        if (required.isEmpty()) return 0d;
        long matched = required.stream().filter(skill -> containsSkill(candidate, skill)).count();
        return (double) matched / required.size();
    }

    private boolean containsSkill(String text, String skill) {
        return normalize(text).contains(normalize(skill));
    }

    private Set<String> tokenize(String text) {
        return TOKEN_SPLIT.splitAsStream(normalize(text))
                .filter(token -> token.length() > 2 && !STOP_WORDS.contains(token))
                .collect(Collectors.toSet());
    }

    private double cosineSimilarity(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) return 0d;
        Set<String> union = new HashSet<>(left);
        union.addAll(right);
        double dot = 0d;
        double leftNorm = 0d;
        double rightNorm = 0d;
        for (String token : union) {
            double a = left.contains(token) ? 1d : 0d;
            double b = right.contains(token) ? 1d : 0d;
            dot += a * b;
            leftNorm += a * a;
            rightNorm += b * b;
        }
        return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
    }

    private String join(String... values) {
        return Arrays.stream(values).filter(Objects::nonNull).collect(Collectors.joining(" "));
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replace("\u00a0", " ").trim();
    }
}
