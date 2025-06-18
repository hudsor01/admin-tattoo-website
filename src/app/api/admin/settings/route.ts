import { type NextRequest, NextResponse } from 'next/server';
import { ValidationPresets, withValidation } from '@/lib/api-validation';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core';
import { type SettingsData, SettingsService } from '@/lib/services/settings-service';

// GET - Fetch current settings
export const GET = withValidation({
  ...ValidationPresets.SETTINGS_READ
})(async () => {
  try {
    // Initialize default settings if none exist
    await SettingsService.initializeDefaultSettings();
    
    // Fetch settings from database
    const settings = await SettingsService.getSettings();

    return NextResponse.json(
      createSuccessResponse(settings, 'Settings retrieved successfully')
    );
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch settings'),
      { status: 500 }
    );
  }
});

// PUT - Update settings
export const PUT = withValidation({
  ...ValidationPresets.SETTINGS_WRITE
})(async (request: NextRequest, validatedData) => {
  try {
    // Since we don't have body schema validation, manually parse the JSON body
    const updates = validatedData?.body as Partial<SettingsData> ?? await request.json();
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        createErrorResponse('No settings data provided'),
        { status: 400 }
      );
    }

    // Update settings in database
    const updatedSettings = await SettingsService.updateSettings(updates);

    return NextResponse.json(
      createSuccessResponse(updatedSettings, 'Settings updated successfully')
    );
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to update settings'),
      { status: 500 }
    );
  }
});
