import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8180",
  realm: "financeflow",
  clientId: "financeflow-spa",
});

export default keycloak;
