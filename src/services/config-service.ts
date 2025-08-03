

import fs from 'fs/promises';
import path from 'path';
import type { AppConfigData } from '@/lib/types';
import { defaultAppConfig } from '@/lib/types';

const configPath = path.join(process.cwd(), 'src', 'config', 'app.config.json');

export async function readConfigFile(): Promise<Partial<AppConfigData>> {
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

export async function writeConfigFile(data: AppConfigData): Promise<void> {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}
