
import { UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AppConfig = {
    title: string;
    logo: LucideIcon;
    currency: string;
    gstNumber?: string;
    dataSource: 'csv' | 'api';
    maxDiscount: number;
    enabledAdminSections: {
        dashboard: boolean;
        menu: boolean;
        staff: boolean;
        customers: boolean;
        settings: boolean;
    },
    loyalty: {
        pointsPerCurrencyUnit: number; // e.g., 0.01 means 1 point per 100 currency units
        currencyUnitPerPoint: number; // e.g., 1 means 1 currency unit (e.g. Rs. 1) per point
    }
}

export const appConfig: AppConfig = {
    title: "KhaneWala",
    logo: UtensilsCrossed,
    currency: "Rs.",
    gstNumber: "27ABCDE1234F1Z5",
    dataSource: "csv",
    maxDiscount: 25,
    enabledAdminSections: {
        dashboard: true,
        menu: true,
        staff: true,
        customers: true,
        settings: true,
    },
    loyalty: {
        pointsPerCurrencyUnit: 0.01,
        currencyUnitPerPoint: 1,
    }
};
