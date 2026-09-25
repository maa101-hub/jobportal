package com.mphasis.hiringtracker.config;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

/**
 * Normalizes a Render/Heroku-style PostgreSQL connection string into the
 * JDBC form Spring Boot expects.
 *
 * <p>Managed providers (Render, Neon, Heroku, Supabase, ...) expose their
 * connection string as
 * {@code postgres://user:password@host:port/dbname?sslmode=require} (also
 * surfaced via the {@code DATABASE_URL} env var). That URI is <em>not</em> a
 * valid JDBC URL, so this post processor rewrites it to
 * {@code jdbc:postgresql://host:port/dbname?sslmode=require} and splits out the
 * username and password into {@code spring.datasource.username} /
 * {@code .password}. Query parameters such as {@code sslmode} are preserved,
 * which providers like Neon require.
 *
 * <p>It looks at {@code SPRING_DATASOURCE_URL} first, then {@code DATABASE_URL}.
 * If the value is already a {@code jdbc:} URL it is left untouched, so local
 * configuration in {@code application.properties} keeps working.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String raw = firstNonBlank(
                environment.getProperty("SPRING_DATASOURCE_URL"),
                environment.getProperty("DATABASE_URL"));

        if (!StringUtils.hasText(raw) || raw.startsWith("jdbc:")) {
            // Nothing to normalize (unset, or already a JDBC URL).
            return;
        }

        if (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://")) {
            return;
        }

        URI uri = URI.create(raw);
        Map<String, Object> props = new HashMap<>();

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        // Preserve query params (e.g. ?sslmode=require) — required by Neon/Supabase.
        // Drop channel_binding, which the PostgreSQL JDBC driver does not accept
        // as a URL parameter (it is a libpq/psql option, not a JDBC one).
        String query = sanitizeQuery(uri.getRawQuery());
        String jdbcUrl = String.format("jdbc:postgresql://%s:%d%s%s",
                uri.getHost(), port, uri.getPath(), query);
        props.put("spring.datasource.url", jdbcUrl);

        String userInfo = uri.getUserInfo();
        if (StringUtils.hasText(userInfo)) {
            String[] parts = userInfo.split(":", 2);
            props.put("spring.datasource.username", parts[0]);
            if (parts.length > 1) {
                props.put("spring.datasource.password", parts[1]);
            }
        }

        // Highest precedence so it overrides the placeholder defaults.
        environment.getPropertySources()
                .addFirst(new MapPropertySource("renderDatabaseUrl", props));
    }

    /**
     * Rebuilds the query string, dropping parameters the PostgreSQL JDBC driver
     * does not understand (notably {@code channel_binding}, which is a
     * libpq-only option). Returns "" or "?key=value&...".
     */
    private static String sanitizeQuery(String rawQuery) {
        if (!StringUtils.hasText(rawQuery)) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (String pair : rawQuery.split("&")) {
            String key = pair.split("=", 2)[0];
            if ("channel_binding".equalsIgnoreCase(key)) {
                continue;
            }
            sb.append(sb.length() == 0 ? "?" : "&").append(pair);
        }
        return sb.toString();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
