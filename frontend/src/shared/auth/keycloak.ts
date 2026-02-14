import Keycloak from "keycloak-js";

function createKeycloak(): Keycloak {
  if (import.meta.env.VITE_E2E_TEST === "true") {
    return {
      authenticated: true,
      token: "e2e-mock-token",
      tokenParsed: {
        preferred_username: "test-user",
        name: "Test User",
        email: "test@example.com",
      },
      init: () => Promise.resolve(true),
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      updateToken: () => Promise.resolve(true),
    } as unknown as Keycloak;
  }

  return new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8180",
    realm: "financeflow",
    clientId: "financeflow-spa",
  });
}

const keycloak = createKeycloak();
export default keycloak;
