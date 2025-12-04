// backend/src/services/settings.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsService {
  /**
   * Get setting value by key
   */
  async get(key: string): Promise<any> {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return null;
    }

    return this.parseValue(setting.value, setting.type);
  }

  /**
   * Get multiple settings by keys
   */
  async getMany(keys: string[]): Promise<Record<string, any>> {
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });

    const result: Record<string, any> = {};
    settings.forEach(setting => {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    });

    return result;
  }

  /**
   * Get all settings by category
   */
  async getByCategory(category: string): Promise<Record<string, any>> {
    const settings = await prisma.setting.findMany({
      where: { category }
    });

    const result: Record<string, any> = {};
    settings.forEach(setting => {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    });

    return result;
  }

  /**
   * Set setting value
   */
  async set(key: string, value: any, type?: string): Promise<void> {
    const stringValue = String(value);
    
    await prisma.setting.upsert({
      where: { key },
      update: { 
        value: stringValue,
        ...(type && { type })
      },
      create: {
        key,
        value: stringValue,
        type: type || 'string'
      }
    });
  }

  /**
   * Parse setting value based on type
   */
  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true' || value === '1';
      case 'integer':
        return parseInt(value, 10);
      case 'float':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Check if we're within office hours
   */
  async isOfficeHours(): Promise<boolean> {
    const settings = await this.getMany([
      'standard_working_from_time',
      'standard_working_to_time',
      'working_days'
    ]);

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if today is a working day
    const workingDays = settings.working_days ? settings.working_days.split(',').map(Number) : [1, 2, 3, 4, 5];
    if (!workingDays.includes(currentDay)) {
      return false;
    }

    // Check if current time is within working hours
    const workStart = settings.standard_working_from_time || '09:00';
    const workEnd = settings.standard_working_to_time || '18:00';

    return currentTime >= workStart && currentTime <= workEnd;
  }

  /**
   * Get automation settings
   */
  async getAutomationSettings() {
    return await this.getByCategory('automation');
  }
}

export default new SettingsService();

export const settingsService = new SettingsService();
