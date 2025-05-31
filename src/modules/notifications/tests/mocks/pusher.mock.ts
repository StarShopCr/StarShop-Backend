export const mockPusher = {
  trigger: jest.fn().mockResolvedValue({}),
  constructor: jest.fn(),
};

jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => mockPusher);
});
