import { ShieldAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SafetyPage() {
  return <PlaceholderPage eyebrow="Safety" title="Prepare with context, not alarm." description="A future safety view will bring together verified notices, practical guidance, and the local information people need before they travel." icon={ShieldAlert} nextStep="Useful safety information, close at hand." />;
}
