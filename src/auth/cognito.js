import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

// Valores inyectados en tiempo de compilación por Vite — nunca viajan al servidor
const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId:   import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
});

/**
 * Inicia sesión con SRP (Secure Remote Password).
 * La contraseña nunca se transmite en plano: el protocolo deriva una
 * prueba criptográfica que Cognito verifica sin conocer la contraseña.
 *
 * Devuelve las mismas claves que la API REST de Cognito para mantener
 * compatibilidad con el resto del código (IdToken, AccessToken, RefreshToken).
 */
export const signIn = (email, password) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });

    user.authenticateUser(
      new AuthenticationDetails({ Username: email, Password: password }),
      {
        onSuccess: (session) =>
          resolve({
            IdToken:      session.getIdToken().getJwtToken(),
            AccessToken:  session.getAccessToken().getJwtToken(),
            RefreshToken: session.getRefreshToken().getToken(),
          }),
        onFailure: (err) => reject(err),
        mfaRequired:         () => reject(Object.assign(new Error('MFA requerido'),      { code: 'MFA_REQUIRED' })),
        totpRequired:        () => reject(Object.assign(new Error('TOTP requerido'),     { code: 'TOTP_REQUIRED' })),
        newPasswordRequired: () => reject(Object.assign(new Error('Cambia tu contraseña'), { code: 'NEW_PASSWORD_REQUIRED' })),
      }
    );
  });

export const signOut = () => userPool.getCurrentUser()?.signOut();
