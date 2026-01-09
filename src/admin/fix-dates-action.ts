'use server';

import { sql } from '@/platforms/postgres';
import { runAuthenticatedAdminServerAction } from '@/auth/server';

export async function fixInvalidDatesAction() {
  return runAuthenticatedAdminServerAction(async () => {
    console.log('Starting to fix invalid dates...');

    try {
      // Find all photos with invalid taken_at_naive format
      const { rows: invalidPhotos } = await sql<{
        id: string;
        taken_at_naive: string;
        taken_at: string;
      }>`
        SELECT id, taken_at_naive, taken_at
        FROM photos
        WHERE 
          taken_at_naive IS NOT NULL
          AND (
            taken_at_naive ~ '\\s+$'
            OR taken_at_naive !~ '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$'
          )
        ORDER BY id
      `;

      console.log(`Found ${invalidPhotos.length} photos with invalid dates`);

      if (invalidPhotos.length === 0) {
        return {
          success: true,
          message: 'No invalid dates found. All dates are valid!',
          fixed: 0,
        };
      }

      const fixes: Array<{ id: string; old: string; new: string }> = [];

      // Fix each invalid date
      for (const photo of invalidPhotos) {
        let fixedDate: string;

        const trimmed = photo.taken_at_naive.trim();
        
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Just a date, add time
          fixedDate = `${trimmed} 00:00:00`;
        } else if (trimmed.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
          // Missing seconds
          fixedDate = `${trimmed}:00`;
        } else {
          // Use taken_at as fallback
          const takenAt = new Date(photo.taken_at);
          const year = takenAt.getFullYear();
          const month = String(takenAt.getMonth() + 1).padStart(2, '0');
          const day = String(takenAt.getDate()).padStart(2, '0');
          const hours = String(takenAt.getHours()).padStart(2, '0');
          const minutes = String(takenAt.getMinutes()).padStart(2, '0');
          const seconds = String(takenAt.getSeconds()).padStart(2, '0');
          fixedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        // Update the database
        await sql`
          UPDATE photos
          SET taken_at_naive = ${fixedDate}
          WHERE id = ${photo.id}
        `;

        fixes.push({
          id: photo.id,
          old: photo.taken_at_naive,
          new: fixedDate,
        });

        console.log(`Fixed photo ${photo.id}: "${photo.taken_at_naive}" → "${fixedDate}"`);
      }

      return {
        success: true,
        message: `Successfully fixed ${fixes.length} photos with invalid dates`,
        fixed: fixes.length,
        details: fixes,
      };

    } catch (error) {
      console.error('Error fixing dates:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fixed: 0,
      };
    }
  });
}
