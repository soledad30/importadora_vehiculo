package com.importadora.principal.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.importadora.principal.config.GoogleOAuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class GoogleTokenVerifier {

    private final GoogleOAuthProperties googleOAuthProperties;

    public GoogleIdToken.Payload verify(String idTokenString) {
        if (!googleOAuthProperties.isEnabled()) {
            throw new BadCredentialsException("Login con Google no está configurado en el servidor");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleOAuthProperties.clientId()))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BadCredentialsException("Token de Google inválido o expirado");
            }
            return idToken.getPayload();
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadCredentialsException("No se pudo validar el token de Google");
        }
    }
}
