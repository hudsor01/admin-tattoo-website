import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { InputJsonValue, JsonValue } from '@prisma/client/runtime/library';

export interface SettingsData {
  studioInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  calcom: {
    autoSync: boolean;
    emailNotifications: boolean;
    webhookUrl: string;
  };
  appearance: {
    darkMode: boolean;
    compactSidebar: boolean;
  };
  notifications: {
    newBookings: boolean;
    payments: boolean;
    dailySummary: boolean;
  };
}

// Default settings
const defaultSettings: SettingsData = {
  studioInfo: {
    name: process.env.STUDIO_NAME || "Ink 37 Tattoos",
    email: process.env.STUDIO_EMAIL || "info@ink37tattoos.com",
    phone: process.env.STUDIO_PHONE || "+1 (555) 123-4567",
    address: process.env.STUDIO_ADDRESS || "123 Tattoo Street, Art City, AC 12345"
  },
  calcom: {
    autoSync: process.env.CALCOM_AUTO_SYNC === 'true',
    emailNotifications: process.env.CALCOM_EMAIL_NOTIFICATIONS !== 'false',
    webhookUrl: process.env.CALCOM_WEBHOOK_URL || "https://ink37tattoos.com/api/webhooks/cal"
  },
  appearance: {
    darkMode: process.env.DEFAULT_DARK_MODE === 'true',
    compactSidebar: process.env.DEFAULT_COMPACT_SIDEBAR === 'true'
  },
  notifications: {
    newBookings: process.env.NOTIFICATIONS_NEW_BOOKINGS !== 'false',
    payments: process.env.NOTIFICATIONS_PAYMENTS !== 'false',
    dailySummary: process.env.NOTIFICATIONS_DAILY_SUMMARY === 'true'
  }
};

export class SettingsService {
  // In-memory cache for settings
  private static cache: SettingsData | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Get all settings, merging database values with defaults
   */
  static async getSettings(): Promise<SettingsData> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache;
    }
    try {
      // Fetch all settings from database
      const dbSettings = await prisma.settings.findMany();
      
      // Convert to Map for secure key-value storage (prevents object injection)
      const settingsMap = new Map<string, JsonValue>();
      dbSettings.forEach(setting => {
        settingsMap.set(setting.key, setting.value);
      });

      // Helper functions for type-safe value extraction
      const getString = (key: string, defaultValue: string): string => {
        const value = settingsMap.get(key);
        if (value === null || value === undefined) return defaultValue;
        return typeof value === 'string' ? value : String(value);
      };

      const getBoolean = (key: string, defaultValue: boolean): boolean => {
        const value = settingsMap.get(key);
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value === 'true';
        return defaultValue;
      };

      // Merge with defaults, prioritizing database values
      const settings: SettingsData = {
        studioInfo: {
          name: getString('studioInfo.name', defaultSettings.studioInfo.name),
          email: getString('studioInfo.email', defaultSettings.studioInfo.email),
          phone: getString('studioInfo.phone', defaultSettings.studioInfo.phone),
          address: getString('studioInfo.address', defaultSettings.studioInfo.address),
        },
        calcom: {
          autoSync: getBoolean('calcom.autoSync', defaultSettings.calcom.autoSync),
          emailNotifications: getBoolean('calcom.emailNotifications', defaultSettings.calcom.emailNotifications),
          webhookUrl: getString('calcom.webhookUrl', defaultSettings.calcom.webhookUrl),
        },
        appearance: {
          darkMode: getBoolean('appearance.darkMode', defaultSettings.appearance.darkMode),
          compactSidebar: getBoolean('appearance.compactSidebar', defaultSettings.appearance.compactSidebar),
        },
        notifications: {
          newBookings: getBoolean('notifications.newBookings', defaultSettings.notifications.newBookings),
          payments: getBoolean('notifications.payments', defaultSettings.notifications.payments),
          dailySummary: getBoolean('notifications.dailySummary', defaultSettings.notifications.dailySummary),
        }
      };

      // Cache the result
      this.cache = settings;
      this.cacheTimestamp = now;

      return settings;
    } catch (error) {
      logger.error('Failed to fetch settings from database:', error);
      // Fallback to defaults if database fails
      return defaultSettings;
    }
  }

  /**
   * Update specific settings in the database
   */
  static async updateSettings(updates: Partial<SettingsData>): Promise<SettingsData> {
    try {
      const updatePromises: Array<Promise<unknown>> = [];

      // Process each category of updates
      for (const [category, values] of Object.entries(updates)) {
        if (values && typeof values === 'object') {
          for (const [key, value] of Object.entries(values)) {
            const settingKey = `${category}.${key}`;
            const description = this.getSettingDescription(category, key);
            const isEnvironment = this.isEnvironmentSetting(category, key);

            updatePromises.push(
              prisma.settings.upsert({
                where: { key: settingKey },
                update: { 
                  value: value as InputJsonValue,
                  updatedAt: new Date()
                },
                create: {
                  key: settingKey,
                  value: value as InputJsonValue,
                  category,
                  description,
                  isEnvironment
                }
              })
            );
          }
        }
      }

      // Execute all updates
      await Promise.all(updatePromises);

      // Invalidate cache
      this.cache = null;
      this.cacheTimestamp = 0;

      // Return updated settings
      return await this.getSettings();
    } catch (error) {
      logger.error('Failed to update settings in database:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Initialize default settings in database if they don't exist
   */
  static async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await prisma.settings.count();
      
      if (existingSettings === 0) {
        logger.info('Initializing default settings in database');
        await this.updateSettings(defaultSettings);
      }
    } catch (error) {
      logger.error('Failed to initialize default settings:', error);
    }
  }

  /**
   * Get setting description for documentation
   */
  private static getSettingDescription(category: string, key: string): string {
    const descriptions = new Map([
      ['studioInfo.name', 'Studio/business name'],
      ['studioInfo.email', 'Primary contact email address'],
      ['studioInfo.phone', 'Primary contact phone number'],
      ['studioInfo.address', 'Studio physical address'],
      ['calcom.autoSync', 'Automatically sync Cal.com appointments'],
      ['calcom.emailNotifications', 'Send email notifications for Cal.com events'],
      ['calcom.webhookUrl', 'Webhook URL for Cal.com integration'],
      ['appearance.darkMode', 'Default dark mode preference'],
      ['appearance.compactSidebar', 'Use compact sidebar layout by default'],
      ['notifications.newBookings', 'Send notifications for new bookings'],
      ['notifications.payments', 'Send notifications for payment updates'],
      ['notifications.dailySummary', 'Send daily summary emails']
    ]);

    return descriptions.get(`${category}.${key}`) || `${category} ${key} setting`;
  }

  /**
   * Determine if a setting should be stored as environment variable
   */
  private static isEnvironmentSetting(category: string, key: string): boolean {
    // API keys, webhooks, and sensitive data should be env vars
    const envSettings = [
      'calcom.webhookUrl',
      'studioInfo.email', // if contains API keys or sensitive data
    ];

    return envSettings.includes(`${category}.${key}`);
  }

  /**
   * Get a specific setting value
   */
  static async getSetting(key: string): Promise<JsonValue | null> {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key }
      });
      return setting?.value ?? null;
    } catch (error) {
      logger.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a specific setting value
   */
  static async setSetting(key: string, value: JsonValue, category?: string): Promise<void> {
    try {
      const [categoryName, settingKey] = key.includes('.') ? key.split('.') : [category || 'general', key];
      
      await prisma.settings.upsert({
        where: { key },
        update: { 
          value: value as InputJsonValue,
          updatedAt: new Date()
        },
        create: {
          key,
          value: value as InputJsonValue,
          category: categoryName,
          description: this.getSettingDescription(categoryName, settingKey),
          isEnvironment: this.isEnvironmentSetting(categoryName, settingKey)
        }
      });
    } catch (error) {
      logger.error(`Failed to set setting ${key}:`, error);
      throw new Error(`Failed to set setting ${key}`);
    }
  }
}
