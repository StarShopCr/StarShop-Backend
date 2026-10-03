import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrustlessWorkProvider } from '@/providers/trustless-work-provider';
import '@trustless-work/react';

vi.mock('@trustless-work/react', () => ({
  TrustlessWorkConfig: ({ children, apiKey, baseURL }: any) => (
    <div data-testid="tw-config" data-api-key={apiKey} data-base-url={baseURL}>
      {children}
    </div>
  ),
}));

describe('TrustlessWorkProvider', () => {
  it('should mount without error when API key is provided', () => {
    process.env.NEXT_PUBLIC_TW_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_TW_BASE_URL = 'https://dev.api.trustlesswork.com';

    expect(() =>
      render(
        <TrustlessWorkProvider>
          <div>Children</div>
        </TrustlessWorkProvider>
      )
    ).not.toThrow();
  });

  it('should throw when API key is missing', () => {
    const originalKey = process.env.NEXT_PUBLIC_TW_API_KEY;
    delete process.env.NEXT_PUBLIC_TW_API_KEY;

    expect(() =>
      render(
        <TrustlessWorkProvider>
          <div>Children</div>
        </TrustlessWorkProvider>
      )
    ).toThrow('NEXT_PUBLIC_TW_API_KEY is required');

    if (originalKey) {
      process.env.NEXT_PUBLIC_TW_API_KEY = originalKey;
    }
  });

  it('should pass apiKey and baseURL to TrustlessWorkConfig', () => {
    process.env.NEXT_PUBLIC_TW_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_TW_BASE_URL = 'https://custom.api.trustlesswork.com';

    const { getByTestId } = render(
      <TrustlessWorkProvider>
        <div>Children</div>
      </TrustlessWorkProvider>
    );

    const config = getByTestId('tw-config');
    expect(config).toHaveAttribute('data-api-key', 'test-api-key');
    expect(config).toHaveAttribute('data-base-url', 'https://custom.api.trustlesswork.com');
  });
});
