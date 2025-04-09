
// This is a compatibility file for Vite builds
// It loads the App component and mounts it to the DOM
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Mount the app to the root element
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
