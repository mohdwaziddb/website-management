import {
  Award,
  Baby,
  Bed,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  CheckCircle,
  Clock,
  Code,
  Coffee,
  Dumbbell,
  Globe,
  GraduationCap,
  Hammer,
  HandHeart,
  HardHat,
  Heart,
  HeartPulse,
  Home,
  Hotel,
  Leaf,
  Lightbulb,
  LucideIcon,
  MapPin,
  Megaphone,
  Music,
  Package,
  Palette,
  PenTool,
  Phone,
  Plane,
  Rocket,
  Ruler,
  Shield,
  Smile,
  Sofa,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  Users,
  Utensils,
  Wifi,
  Zap
} from "lucide-react";

// Backend ModuleRegistry.ICONS me same naam (Services / Stats ka "Icon" dropdown)
const ICONS: Record<string, LucideIcon> = {
  Star, Heart, Shield, Zap, Award, Users, Clock, Phone, MapPin, Leaf, Coffee, Utensils, Dumbbell, Home, Building2, Stethoscope,
  HeartPulse, GraduationCap, BookOpen, Briefcase, TrendingUp, Megaphone, Camera, Palette, Hammer, HardHat, Plane, Hotel, Globe,
  Sparkles, Target, Rocket, Code, PenTool, Smile, Baby, Bed, Wifi, Car, Music, Trophy, Lightbulb, HandHeart, Sofa, Ruler, Truck,
  Package, CheckCircle
};

export const ICON_NAMES = Object.keys(ICONS);

export function SiteIcon({ name, className = "h-6 w-6" }: { name: unknown; className?: string }) {
  const I = (typeof name === "string" && ICONS[name]) || Sparkles;
  return <I className={className} />;
}
