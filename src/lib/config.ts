
import type { LucideIcon } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import type { AppConfigData } from '@/lib/types';
import { getAppConfig } from '@/app/actions';

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
let appConfig: (AppConfigData & { logoIcon: LucideIcon });

appConfigPromise.then(config => {
    appConfig = config;
});

// We can export the resolved config for immediate use in client components if they
// don't need the absolute latest server config on first render.
export { appConfig };

