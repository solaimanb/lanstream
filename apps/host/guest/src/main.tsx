import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GuestApp } from "./guest-app";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Guest app root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <GuestApp />
  </StrictMode>,
);
