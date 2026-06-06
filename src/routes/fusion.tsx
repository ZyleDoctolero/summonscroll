import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/fusion.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/fusion")({
  head: () => ({ meta: [{ title: "Fusion Matrix - SummonScroll" }] }),
  component: () => <Screen html={html} title="Fusion Matrix - SummonScroll" />,
});
