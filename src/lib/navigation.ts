import {
  BookOpen,
  Compass,
  Languages,
  Map,
  Music,
  Newspaper,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { NavigationItem } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  { label: "Home", href: "/", icon: Sparkles },
  { label: "Explore", href: "/explore", icon: BookOpen },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Music", href: "/music", icon: Music },
  { label: "Safety", href: "/safety", icon: ShieldAlert },
  { label: "Khowar", href: "/khowar", icon: Languages },
  { label: "Map", href: "/map", icon: Map },
];
