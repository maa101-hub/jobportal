package com.mphasis.hiringtracker.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthContextTest {

    @Test
    void readsAuthenticatedUserAndCompanyContext() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(JwtAuthFilter.AUTH_USER_ID)).thenReturn(42L);
        when(request.getAttribute(JwtAuthFilter.AUTH_COMPANY_ID)).thenReturn(7L);
        when(request.getAttribute(JwtAuthFilter.AUTH_ROLE)).thenReturn("TAG");

        assertEquals(42L, AuthContext.requireUserId(request));
        assertEquals(7L, AuthContext.requireCompanyId(request));
        AuthContext.requireRole(request, "TAG", "ADMIN");
        AuthContext.requireCompany(request, 7L);
    }

    @Test
    void rejectsMissingIdentity() {
        HttpServletRequest request = mock(HttpServletRequest.class);

        assertThrows(AuthContext.UnauthorizedException.class,
                () -> AuthContext.requireUserId(request));
        assertThrows(AuthContext.ForbiddenException.class,
                () -> AuthContext.requireCompanyId(request));
    }

    @Test
    void rejectsWrongRoleAndCompany() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(JwtAuthFilter.AUTH_ROLE)).thenReturn("DELIVERY");
        when(request.getAttribute(JwtAuthFilter.AUTH_COMPANY_ID)).thenReturn(7L);

        assertThrows(AuthContext.ForbiddenException.class,
                () -> AuthContext.requireRole(request, "TAG", "ADMIN"));
        assertThrows(AuthContext.ForbiddenException.class,
                () -> AuthContext.requireCompany(request, 99L));
    }
}
