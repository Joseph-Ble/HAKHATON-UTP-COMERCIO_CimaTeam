import React, { useState } from "react";
import { router } from "expo-router";
import {
  Page,
  T,
  Field,
  Button,
  Action,
  ErrorText,
  Info,
  Stack,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";

export function RecoveryScreen() {
  const app = useApp();
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = async () => {
    setBusy(true);
    setError("");
    try {
      if (password !== confirm)
        throw new Error("Las contraseñas deben coincidir.");
      if (password.length < 8 || password.length > 128)
        throw new Error("Usa una contraseña de 8 a 128 caracteres.");
      await app.resetPassword(password);
      await app.signOut();
      app.setNotice(
        "Tu contraseña se actualizó. Ingresa con la nueva contraseña.",
      );
      router.replace("/cuenta");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page
      back
      wide={false}
      title="Crea una nueva contraseña"
      subtitle="Usa una contraseña exclusiva que puedas recordar."
    >
      {app.mode === "local" ? (
        <Info>
          Las cuentas de esta instalación se guardan en el dispositivo y no
          utilizan enlaces por correo. En Ajustes encontrarás las cuentas de
          ejemplo.
        </Info>
      ) : app.authError ? (
        <ErrorText>{app.authError}</ErrorText>
      ) : !app.user ? (
        <Info>
          Abre el enlace de recuperación que recibiste por correo para
          continuar. Si venció, solicita uno nuevo desde Ingresar.
        </Info>
      ) : (
        <Stack>
          <Field
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            maxLength={128}
          />
          <Field
            label="Confirma la nueva contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            maxLength={128}
          />
          {!!error && <ErrorText>{error}</ErrorText>}
          <Button loading={busy} onPress={update}>
            Guardar nueva contraseña
          </Button>
        </Stack>
      )}
      <Button variant="secondary" onPress={() => router.replace("/cuenta")}>
        Volver a Ingresar
      </Button>
    </Page>
  );
}
