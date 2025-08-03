
import { UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppConfigData } from '@/services/config-service';
import { getAppConfig } from '@/services/config-service';

// Renamed from appConfig to defaultAppConfig
export const defaultAppConfig = {
    title: "KhaneWala",
    logo: "/logo.png", // Default logo path
    theme: 'default' as const,
    font: 'pt-sans' as const,
    dataSource: "firebase" as const,
    currency: "Rs.",
    gstNumber: "27ABCDE1234F1Z5",
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
    },
    archiveFileLimit: 5 * 1024 * 1024, // 5MB
};


// This will be dynamically generated on each server-side render
async function loadConfig() {
    const configData = await getAppConfig();
    return {
        ...configData,
        logoIcon: UtensilsCrossed, // Keep the icon component separate
    };
}

// We export a promise that resolves to the config
export const appConfigPromise = loadConfig();

// For client-side components that can't be async, we need a way to get the config.
// This is a simplified approach. In a complex app, you might use a client-side store.
// Let's modify this later if needed. For now, we will make components async.
let appConfig: AppConfigData & { logoIcon: LucideIcon };

appConfigPromise.then(config => {
    appConfig = config;
});

// We can export the resolved config for immediate use in client components if they
// don't need the absolute latest server config on first render.
export { appConfig };
