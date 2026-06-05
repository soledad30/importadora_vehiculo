package com.importadora.principal.domain.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.importadora.principal.api.dto.AuthConfigResponse;
import com.importadora.principal.api.dto.GoogleLoginRequest;
import com.importadora.principal.api.dto.LoginRequest;
import com.importadora.principal.api.dto.LoginResponse;
import com.importadora.principal.config.GoogleOAuthProperties;
import com.importadora.principal.domain.model.Usuario;
import com.importadora.principal.domain.repository.UsuarioRepository;
import com.importadora.principal.security.GoogleTokenVerifier;
import com.importadora.principal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final GoogleOAuthProperties googleOAuthProperties;

    public AuthConfigResponse authConfig() {
        return new AuthConfigResponse(
                googleOAuthProperties.isEnabled() ? googleOAuthProperties.clientId() : "",
                googleOAuthProperties.isEnabled()
        );
    }

    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadCredentialsException("Credenciales inválidas");
        }

        Usuario usuario = usuarioRepository.findByUsernameWithCliente(request.username())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        return toLoginResponse(usuario);
    }

    public LoginResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.idToken());
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("El token de Google no incluye correo electrónico");
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BadCredentialsException("El correo de Google no está verificado");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCaseWithCliente(email)
                .orElseThrow(() -> new BadCredentialsException(
                        "No hay usuario registrado con " + email + ". Solicite acceso al administrador."));

        if (!usuario.isActivo()) {
            throw new BadCredentialsException("Usuario inactivo");
        }

        return toLoginResponse(usuario);
    }

    private LoginResponse toLoginResponse(Usuario usuario) {
        String token = jwtService.generateToken(usuario);
        Long clienteId = null;
        String clienteNombre = null;
        if (usuario.getCliente() != null) {
            clienteId = usuario.getCliente().getId();
            clienteNombre = usuario.getCliente().nombreCompleto();
        }
        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationMs(),
                usuario.getUsername(),
                usuario.getRol(),
                clienteId,
                clienteNombre
        );
    }
}
