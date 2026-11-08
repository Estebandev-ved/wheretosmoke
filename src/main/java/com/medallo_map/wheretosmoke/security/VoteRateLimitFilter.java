package com.medallo_map.wheretosmoke.security;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Aplica VoteRateLimiter a POST /api/spots/{id}/tombo y /relax. Usa getRemoteAddr (sin X-Forwarded-For). */
@Component
public class VoteRateLimitFilter extends OncePerRequestFilter {

    private static final Pattern RUTA = Pattern.compile("^/api/spots/(\\d+)/(tombo|relax)$");

    private final VoteRateLimiter limiter;

    public VoteRateLimitFilter(VoteRateLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod()) || !RUTA.matcher(request.getRequestURI()).matches();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Matcher m = RUTA.matcher(request.getRequestURI());
        m.matches();
        String fp = request.getParameter("fingerprint");
        if (!limiter.permitir(request.getRemoteAddr(), fp == null ? "" : fp, Long.valueOf(m.group(1)))) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", "3600");
            response.getWriter().write("{\"error\":\"Demasiados votos. Intenta mas tarde.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
