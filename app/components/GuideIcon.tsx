import { Baby, Flower2, HandHeart, IdCard, Landmark, PencilLine, Store, Users } from "lucide-react";
import type { ServiceGuide } from "../content/service-guides";

const ICONS = { baby: Baby, flower: Flower2, pencil: PencilLine, id: IdCard, users: Users, store: Store, landmark: Landmark, hand: HandHeart };

export function GuideIcon({ icon, size = 24 }: { icon: ServiceGuide["icon"]; size?: number }) {
  const Icon = ICONS[icon];
  return <Icon size={size} aria-hidden />;
}
