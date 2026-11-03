import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "../AuthContext";

export const AppProviders = ({ children }) => (
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
