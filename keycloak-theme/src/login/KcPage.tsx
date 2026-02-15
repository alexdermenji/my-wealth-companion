import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultTemplate from "keycloakify/login/Template";
import "./main.css";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const LoginResetPassword = lazy(() => import("./pages/LoginResetPassword"));
const LoginUpdatePassword = lazy(() => import("./pages/LoginUpdatePassword"));
const ErrorPage = lazy(() => import("./pages/Error"));

const DefaultPage = lazy(() => import("keycloakify/login/DefaultPage"));
const UserProfileFormFields = lazy(() => import("keycloakify/login/UserProfileFormFields"));

const doMakeUserConfirmPassword = true;

const classes = {} satisfies { [key in ClassKey]?: string };

export default function KcPage(props: { kcContext: KcContext }) {
  const { kcContext } = props;

  const { i18n } = useI18n({ kcContext });

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case "login.ftl":
            return <Login kcContext={kcContext} i18n={i18n} />;
          case "register.ftl":
            return <Register kcContext={kcContext} i18n={i18n} />;
          case "login-reset-password.ftl":
            return <LoginResetPassword kcContext={kcContext} i18n={i18n} />;
          case "login-update-password.ftl":
            return <LoginUpdatePassword kcContext={kcContext} i18n={i18n} />;
          case "error.ftl":
            return <ErrorPage kcContext={kcContext} i18n={i18n} />;
          default:
            return (
              <DefaultPage
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={DefaultTemplate}
                doUseDefaultCss={true}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
              />
            );
        }
      })()}
    </Suspense>
  );
}
