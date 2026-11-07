export function remoteError(
  error,
  fallback = "No se pudo completar la operación. Vuelve a intentarlo.",
) {
  const message = String(error?.message || "");
  if (/fetch|network|timeout|timed out|connec/i.test(message))
    return new Error(
      "No pudimos conectarnos. Revisa tu conexión y vuelve a intentar.",
    );
  if (/invalid login credentials/i.test(message))
    return new Error("Correo o contraseña incorrectos.");
  if (/email not confirmed/i.test(message))
    return new Error("Confirma tu correo antes de ingresar.");
  if (/rate limit|too many|429/i.test(message))
    return new Error(
      "Hubo varios intentos seguidos. Espera un momento y vuelve a intentar.",
    );
  if (/jwt|refresh token|session.*expired/i.test(message))
    return new Error("Tu sesión venció. Vuelve a ingresar.");
  if (/duplicate key|unique constraint/i.test(message))
    return new Error(
      "Ya registraste esta acción. Actualiza la información para consultarla.",
    );
  if (
    /check constraint|not-null constraint|invalid input syntax/i.test(message)
  )
    return new Error("Revisa los datos del formulario antes de enviarlos.");
  // Keep application errors authored in Spanish; do not expose database details.
  if (
    /^(No puedes|Solo puedes|Esta |Este |La |Ya |Revisa |Escribe |Inicia |Publicación|Acción|Selecciona |Recurso|Oferta)/.test(
      message,
    )
  )
    return new Error(message);
  return new Error(fallback);
}
