import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import { AppRouter } from "./AppRouter";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrgProvider } from "@/context/OrgContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <OrgProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </OrgProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
