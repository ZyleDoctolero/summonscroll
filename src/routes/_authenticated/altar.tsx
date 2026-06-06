import { createFileRoute } from "@tanstack/react-router";
import html from "../../screens/altar.html?raw";
import { Screen } from "../../screens/Screen";

export const Route = createFileRoute("/_authenticated/altar")({
  head: () => ({ meta: [{ title: "Altar - SummonScroll" }] }),
  component: () => <Screen html={html} title="Altar - SummonScroll" />,
});
