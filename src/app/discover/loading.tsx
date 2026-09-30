import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function PlacesLoading() {
  return <AppShell><main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><LoadingState label="places" /></main></AppShell>;
}