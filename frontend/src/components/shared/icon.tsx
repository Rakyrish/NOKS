import {
  Atom,
  BadgeCheck,
  Beaker,
  Boxes,
  Calendar,
  CheckCircle,
  ChevronRight,
  Droplets,
  Factory,
  FlaskConical,
  Fuel,
  Globe,
  HardHat,
  Headset,
  HeartPulse,
  Hotel,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  Microscope,
  Mountain,
  Newspaper,
  Package,
  PaintRoller,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Ship,
  Smile,
  Sprout,
  Tag,
  Truck,
  Users,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

/**
 * Explicit registry keyed by the `icon` slug stored in Django.
 * Explicit beats dynamic here: it tree-shakes, and an unknown slug
 * degrades to a sensible default instead of crashing the page.
 */
const ICONS: Record<string, LucideIcon> = {
  atom: Atom,
  "badge-check": BadgeCheck,
  beaker: Beaker,
  boxes: Boxes,
  calendar: Calendar,
  "check-circle": CheckCircle,
  droplets: Droplets,
  factory: Factory,
  "flask-conical": FlaskConical,
  fuel: Fuel,
  globe: Globe,
  "hard-hat": HardHat,
  headset: Headset,
  "heart-pulse": HeartPulse,
  hotel: Hotel,
  "life-buoy": LifeBuoy,
  "list-checks": ListChecks,
  "message-circle": MessageCircle,
  microscope: Microscope,
  mountain: Mountain,
  newspaper: Newspaper,
  package: Package,
  "paint-roller": PaintRoller,
  search: Search,
  settings: Settings,
  "shield-check": ShieldCheck,
  shirt: Shirt,
  ship: Ship,
  "shopping-cart": ShoppingCart,
  smile: Smile,
  sprout: Sprout,
  tag: Tag,
  truck: Truck,
  users: Users,
  utensils: Utensils,
  warehouse: Warehouse,
};

export const Icon = ({
  name,
  className,
  fallback = ChevronRight,
}: {
  name?: string | null;
  className?: string;
  fallback?: LucideIcon;
}) => {
  const Component = (name && ICONS[name]) || fallback;
  return <Component className={className} aria-hidden />;
};
