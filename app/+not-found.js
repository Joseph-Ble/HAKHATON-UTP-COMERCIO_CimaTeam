import React from "react";
import { router } from "expo-router";
import { Page, Empty } from "../src/components/ui.js";
export default function Missing() {
  return (
    <Page>
      <Empty
        title="Esta página no está disponible"
        description="Regresa al inicio para seguir explorando tu comunidad."
        action="Ir al inicio"
        onPress={() => router.replace("/")}
      />
    </Page>
  );
}
