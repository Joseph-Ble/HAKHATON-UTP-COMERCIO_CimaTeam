import test from "node:test";
import assert from "node:assert/strict";
import { parseAuthLink } from "../src/core/authLinks.js";
import { remoteError } from "../src/core/remoteErrors.js";

test("native recovery accepts PKCE links and opaque tokens only on auth routes", () => {
  assert.deepEqual(
    parseAuthLink("entrevecinos:///recuperar?code=example-code"),
    { code: "example-code", path: "/recuperar" },
  );
  assert.deepEqual(
    parseAuthLink(
      "entrevecinos://recuperar#access_token=example-a&refresh_token=example-r",
    ),
    { accessToken: "example-a", refreshToken: "example-r", path: "/recuperar" },
  );
  assert.equal(
    parseAuthLink("entrevecinos:///publicacion/123?code=example"),
    null,
  );
  assert.equal(parseAuthLink("javascript:alert(1)"), null);
});
test("web recovery requires the application origin and ignores unrelated links", () => {
  assert.equal(
    parseAuthLink(
      "https://other.example/recuperar?code=example",
      "https://app.example",
    ),
    null,
  );
  assert.equal(
    parseAuthLink("https://app.example/recuperar?code=example"),
    null,
  );
  assert.deepEqual(
    parseAuthLink(
      "https://app.example/recuperar?code=example",
      "https://app.example",
    ),
    { code: "example", path: "/recuperar" },
  );
  assert.equal(parseAuthLink("not a URL"), null);
  assert.equal(parseAuthLink(null), null);
});
test("expired links do not surface raw provider error descriptions", () => {
  const parsed = parseAuthLink(
    "entrevecinos:///recuperar#error=access_denied&error_description=sensitive-example",
  );
  assert.ok(parsed.error.includes("venció"));
  assert.ok(!parsed.error.includes("sensitive-example"));
  assert.equal(
    parseAuthLink("entrevecinos:///recuperar#access_token=example-only"),
    null,
  );
});
test("development links and signup confirmation use the same safe auth parser", () => {
  assert.deepEqual(
    parseAuthLink("exp://127.0.0.1:8081/--/recuperar?code=example"),
    { code: "example", path: "/recuperar" },
  );
  assert.deepEqual(parseAuthLink("entrevecinos:///cuenta?code=example"), {
    code: "example",
    path: "/cuenta",
  });
});
test("remote errors explain network, session and form failures without database internals", () => {
  assert.match(
    remoteError({ message: "Network request failed" }).message,
    /conexión/,
  );
  assert.match(
    remoteError({ message: "Invalid login credentials" }).message,
    /incorrectos/,
  );
  assert.match(remoteError({ message: "JWT expired" }).message, /sesión/);
  assert.match(
    remoteError({ message: "check constraint public_secret_name" }).message,
    /formulario/,
  );
  assert.ok(
    !remoteError({
      message: "internal details: example-password",
    }).message.includes("example-password"),
  );
  assert.equal(
    remoteError({ message: "No puedes valorar tu propia publicación." })
      .message,
    "No puedes valorar tu propia publicación.",
  );
});
