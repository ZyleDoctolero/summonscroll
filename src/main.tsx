import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { getRouter, queryClient } from "./router";
import "./styles.css";

// Apply the user's saved reduce-motion preference before first paint so
// animations never flash on. The toggle lives in Profile -> Stats; the CSS
// rule for [data-reduce-motion="true"] lives in styles.css.
if (localStorage.getItem("ss-reduce-motion") === "true") {
  document.documentElement.dataset.reduceMotion = "true";
}

const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
