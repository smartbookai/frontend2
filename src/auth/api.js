// Autenticación mediada por el backend (sba-infra-cdk) — ya no hablamos con
// Cognito directamente desde el navegador. La contraseña viaja una única vez,
// por HTTPS, al endpoint de login; a partir de ahí todo son códigos y tokens
// de un solo uso que el propio backend cifra/retiene cuando hace falta MFA.
const API_BASE = "https://vmkldqb82b.execute-api.eu-south-2.amazonaws.com/prod";

const postJson = async (path, body) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

/** POST /auth/login — credenciales → { status: 'OK' | 'MFA_REQUIRED' | 'MFA_ENFORCEMENT_REQUIRED', ... } */
export const login = (email, password) => postJson("/auth/login", { email, password });

/**
 * POST /auth/login — misma ruta, pero con el "code" de Google en vez de
 * contraseña. El backend canjea el code, aplica el mismo filtro de MFA que un
 * login por contraseña, y devuelve además el email verificado (útil para
 * register.html, que no está "iniciando sesión" sino solo comprobando el
 * correo antes de pagar).
 */
export const loginConGoogle = (googleCode, googleRedirectUri) =>
  postJson("/auth/login", { googleCode, googleRedirectUri });

/**
 * POST /auth/mfa/setup — genera un secreto TOTP nuevo.
 * Solo cuando el login respondió MFA_ENFORCEMENT_REQUIRED: { registrationToken }.
 */
export const setupAuthenticator = ({ registrationToken }) =>
  postJson("/auth/mfa/setup", { registrationToken });

/**
 * POST /auth/mfa/verify — canjea el código de 6 dígitos.
 *  - { session, email, code }             → ya tenía autenticador (MFA_REQUIRED)
 *  - { registrationToken, code }          → primer enlace forzado (MFA_ENFORCEMENT_REQUIRED)
 * En ambos casos, éxito devuelve { status: 'OK', tokens }.
 */
export const verifyAuthenticator = (payload) => postJson("/auth/mfa/verify", payload);

/**
 * POST /auth/olvide-password — siempre responde 200 con el mismo mensaje
 * genérico, exista o no la cuenta (el backend decide en silencio si manda
 * el correo). Nunca hay nada que distinguir aquí por status.
 */
export const solicitarResetPassword = (email) => postJson("/auth/olvide-password", { email });

/** POST /auth/restablecer-password — canjea el token del correo con la contraseña nueva. */
export const restablecerPassword = (token, password) => postJson("/auth/restablecer-password", { token, password });

/**
 * POST /auth/restablecer-password/enviar-sms — segundo factor del propio
 * "olvidé mi contraseña". Manda un código de 6 dígitos al móvil asociado a la
 * cuenta y devuelve el teléfono enmascarado para mostrarlo en pantalla.
 */
export const enviarCodigoSms = (token) => postJson("/auth/restablecer-password/enviar-sms", { token });

/**
 * POST /auth/restablecer-password/verificar-sms — canjea el código de 6
 * dígitos. Solo tras esto acepta restablecerPassword() el cambio de contraseña.
 */
export const verificarCodigoSms = (token, codigo) => postJson("/auth/restablecer-password/verificar-sms", { token, codigo });
