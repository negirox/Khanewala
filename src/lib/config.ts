import { UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AppConfig = {
    title: string;
    logo: LucideIcon;
    currency: string;
    gstNumber?: string;
    maxDiscount: number;
    enabledAdminSections: {
        dashboard: boolean;
        menu: boolean;
        staff: boolean;
        customers: boolean;
        settings: boolean;
    }
}

export const appConfig: AppConfig = {
    title: "KhaneWala",
    logo: UtensilsCrossed,
    currency: "$",
    gstNumber: "27ABCDE1234F1Z5",
    maxDiscount: 25,
    enabledAdminSections: {
        dashboard: true,
        menu: true,
        staff: true,
        customers: true,
        settings: true,
    }
};
