import { UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AppConfig = {
    title: string;
    logo: LucideIcon;
    currency: string;
}

export const appConfig: AppConfig = {
    title: "KhaneWala",
    logo: UtensilsCrossed,
    currency: "$",
};
