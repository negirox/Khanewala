
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { AppTheme, AppFont, AppDataSource } from '@/lib/types';
import { defaultAppConfig } from '@/lib/config';

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
