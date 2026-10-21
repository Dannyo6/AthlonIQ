import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./features/auth/AuthContext";
import { AthloniqProvider } from "./hooks/useAthloniqState";
import { App } from "./app/App";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AthloniqProvider>
            <App />
          </AthloniqProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
