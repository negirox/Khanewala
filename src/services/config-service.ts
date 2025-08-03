
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { AppTheme, AppFont, AppDataSource } from '@/lib/types';

// Moved from lib/config.ts to break circular dependency
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


export interface AppConfigData {
  title: string;
  logo: string;
  theme: AppTheme;
  font: AppFont;
  dataSource: AppDataSource;
  enabledAdminSections: {
      dashboard: boolean;
      menu: boolean;
      staff: boolean;
      customers: boolean;
      settings: boolean;
  };
  gstNumber?: string;
  currency: string;
  maxDiscount: number;
  loyalty: {
      pointsPerCurrencyUnit: number;
      currencyUnitPerPoint: number;
  };
  archiveFileLimit: number;
}


const configPath = path.join(process.cwd(), 'src', 'config', 'app.config.json');

async function readConfigFile(): Promise<Partial<AppConfigData>> {
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {}; // Return empty object if file doesn't exist
    }
    console.error('Error reading config file:', error);
    return {};
  }
}

async function writeConfigFile(data: AppConfigData): Promise<void> {
  try {
    await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}

export async function getAppConfig(): Promise<AppConfigData> {
  const customConfig = await readConfigFile();
  // Merge default and custom config
  const mergedConfig = {
    ...defaultAppConfig,
    ...customConfig,
    enabledAdminSections: {
      ...defaultAppConfig.enabledAdminSections,
      ...customConfig.enabledAdminSections,
    },
    loyalty: {
        ...defaultAppConfig.loyalty,
        ...customConfig.loyalty,
    }
  };
  return mergedConfig;
}

export async function saveAppConfig(newConfig: AppConfigData): Promise<void> {
  await writeConfigFile(newConfig);
}
