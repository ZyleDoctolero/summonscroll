import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/bazaar.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/bazaar")({
  head: () => ({ meta: [{ title: "SummonScroll Shop" }] }),
  component: () => <Screen html={html} title="SummonScroll Shop" />,
});
