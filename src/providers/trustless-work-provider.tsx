'use client';

import { TrustlessWorkConfig } from '@trustless-work/react';
import { ReactNode } from 'react';

interface TrustlessWorkProviderProps {
  children: ReactNode;
}

export function TrustlessWorkProvider({ children }: TrustlessWorkProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_TW_API_KEY;

  if (!apiKey) {
    throw new Error(
      'NEXT_PUBLIC_TW_API_KEY is required. Please set it in your environment variables.'
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_TW_BASE_URL ?? 'https://dev.api.trustlesswork.com';

  return (
    <TrustlessWorkConfig apiKey={apiKey} baseURL={baseUrl}>
      {children}
    </TrustlessWorkConfig>
  );
}
