
import fs from 'fs/promises';
import path from 'path';
import type { AppConfigData } from '@/lib/types';

const configPath = path.join(process.cwd(), 'src', 'config', 'app.config.json');
const adminConfigPath = path.join(process.cwd(), 'adminconfig.json');

// App Config
export async function readAppConfigFile(): Promise<Partial<AppConfigData>> {
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {}; // Return empty object if file doesn't exist
    }
    console.error('Error reading app config file:', error);
    return {};
  }
}

export async function writeAppConfigFile(data: AppConfigData): Promise<void> {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing app config file:', error);
    throw error;
  }
}

// Admin Config
export async function readAdminConfigFile(): Promise<{username: string, password: string}> {
    const configFile = await fs.readFile(adminConfigPath, 'utf8');
    return JSON.parse(configFile);
}

// Logo Upload
export async function saveUploadedLogo(buffer: Buffer): Promise<string> {
    const filename = "logo.png"; // Always use the same name to overwrite
    const publicPath = path.join(process.cwd(), 'public', filename);
    await fs.writeFile(publicPath, buffer);
    // The URL path will be relative to the public folder
    return `/${filename}`;
}
