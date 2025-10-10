/**
 * Google Sheets Sync Library
 *
 * Provides bidirectional sync between Supabase and Google Sheets for advisor data.
 * Used by AI agents to access advisor information.
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const sheets = google.sheets('v4');

export interface AdvisorSheetData {
  clerkUserId: string;
  email: string;
  fullName: string;
  businessName?: string;
  arn?: string;
  phone?: string;
  plan: string;
  segments?: string[];
}

/**
 * Initialize Google Sheets API auth
 */
async function getAuthClient(): Promise<JWT> {
  // Check if credentials file exists
  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS || './config/google-credentials.json';

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return (await auth.getClient()) as JWT;
  } catch (error) {
    console.error('[SHEETS] Auth error:', error);
    throw new Error('Failed to initialize Google Sheets auth');
  }
}

/**
 * Sync advisor data to Google Sheets
 * @param data - Advisor data to sync
 */
export async function syncAdvisorToSheets(
  data: AdvisorSheetData
): Promise<void> {
  try {
    const auth = await getAuthClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      console.warn('[SHEETS] GOOGLE_SHEETS_ID not configured, skipping sync');
      return;
    }

    // Check if advisor already exists
    const existingRow = await findAdvisorRow(auth, spreadsheetId, data.email);

    const rowData = [
      data.clerkUserId,
      data.email,
      data.fullName,
      data.businessName || '',
      data.arn || '',
      data.phone || '',
      data.plan,
      data.segments?.join(', ') || '',
      new Date().toISOString(),
    ];

    if (existingRow !== null) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `Sheet1!A${existingRow}:I${existingRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData],
        },
      });
      console.log(`[SHEETS] Updated advisor ${data.email} at row ${existingRow}`);
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Sheet1!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData],
        },
      });
      console.log(`[SHEETS] Added new advisor ${data.email}`);
    }
  } catch (error) {
    console.error('[SHEETS] Sync error:', error);
    // Don't throw - Google Sheets sync is non-critical
  }
}

/**
 * Find advisor row in Google Sheets by email
 * @param auth - Google auth client
 * @param spreadsheetId - Spreadsheet ID
 * @param email - Email to search for
 * @returns Row number (1-indexed) or null if not found
 */
async function findAdvisorRow(
  auth: JWT,
  spreadsheetId: string,
  email: string
): Promise<number | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!B:B', // Email column
    });

    const rows = response.data.values || [];
    const index = rows.findIndex((row) => row[0] === email);

    return index !== -1 ? index + 1 : null;
  } catch (error) {
    console.error('[SHEETS] Error finding advisor row:', error);
    return null;
  }
}

/**
 * Get all advisors from Google Sheets
 * @returns Array of advisor data
 */
export async function getAllAdvisorsFromSheets(): Promise<AdvisorSheetData[]> {
  try {
    const auth = await getAuthClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      console.warn('[SHEETS] GOOGLE_SHEETS_ID not configured');
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!A:I',
    });

    const rows = response.data.values || [];

    // Skip header row
    const advisors = rows.slice(1).map((row) => ({
      clerkUserId: row[0] || '',
      email: row[1] || '',
      fullName: row[2] || '',
      businessName: row[3] || undefined,
      arn: row[4] || undefined,
      phone: row[5] || undefined,
      plan: row[6] || 'trial',
      segments: row[7] ? row[7].split(', ').filter(Boolean) : undefined,
    }));

    console.log(`[SHEETS] Retrieved ${advisors.length} advisors from Sheets`);
    return advisors;
  } catch (error) {
    console.error('[SHEETS] Error retrieving advisors:', error);
    return [];
  }
}

/**
 * Initialize Google Sheets with header row (run once)
 */
export async function initializeSheets(): Promise<void> {
  try {
    const auth = await getAuthClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      console.warn('[SHEETS] GOOGLE_SHEETS_ID not configured');
      return;
    }

    const headerRow = [
      'Clerk User ID',
      'Email',
      'Full Name',
      'Business Name',
      'ARN',
      'Phone',
      'Plan',
      'Segments',
      'Last Updated',
    ];

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Sheet1!A1:I1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headerRow],
      },
    });

    console.log('[SHEETS] Initialized header row');
  } catch (error) {
    console.error('[SHEETS] Initialization error:', error);
  }
}
