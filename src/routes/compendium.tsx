import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/compendium.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/compendium")({
  head: () => ({ meta: [{ title: "SummonScroll - Compendium" }] }),
  component: () => <Screen html={html} title="SummonScroll - Compendium" />,
});
