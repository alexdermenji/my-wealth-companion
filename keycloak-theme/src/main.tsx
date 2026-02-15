import { createRoot } from "react-dom/client";
import { StrictMode, Suspense } from "react";
import { KcPage } from "./kc.gen";

// NOTE: The following block can be uncommented to test a specific page during development
// import { getKcContextMock } from "./login/KcPageStory";
// if (import.meta.env.DEV) {
//   window.kcContext = getKcContextMock({
//     pageId: "login.ftl",
//     overrides: {}
//   });
// }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {!window.kcContext ? (
      <h1>No Keycloak Context</h1>
    ) : (
      <Suspense>
        <KcPage kcContext={window.kcContext} />
      </Suspense>
    )}
  </StrictMode>
);
