'use client';

import { useEffect } from 'react';
import { attachGlobalErrorHandlers } from '@/lib/telemetry';

export function TelemetryBoundary() {
  useEffect(() => {
    attachGlobalErrorHandlers();
  }, []);

  return null;
}
