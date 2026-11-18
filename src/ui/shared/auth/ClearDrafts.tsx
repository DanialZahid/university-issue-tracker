'use client';

import { useEffect } from 'react';
import { clearAllDrafts } from '@/utils/complaint-draft';

// Placed on the sign-in page: anyone who reaches it is signed out, so unsent
// complaint drafts in this browser are removed.
export function ClearDrafts() {
  useEffect(() => clearAllDrafts(), []);
  return null;
}
