import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import "./index.css";
import App from "./App"; // <--- Se quitó la extensión .jsx
import { theme } from "./theme/theme";
import { NotificationProvider } from '@/components/layout/NotificationProvider';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />  
      <NotificationProvider>
      <App />
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
);
