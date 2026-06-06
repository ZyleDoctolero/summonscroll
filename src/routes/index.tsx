import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/index.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "SummonScroll - Hub" }] }),
  component: () => <Screen html={html} title="SummonScroll - Hub" />,
});
