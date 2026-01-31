import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  isActive?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

