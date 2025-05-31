export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      PUSHER_APP_ID: 'test-app-id',
      PUSHER_KEY: 'test-key',
      PUSHER_SECRET: 'test-secret',
      PUSHER_CLUSTER: 'test-cluster',
    };
    return config[key];
  }),
};
