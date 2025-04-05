import mockDpsnClient from '../mocks/dpsnClient.mock';

// Export the mock client as the default export
const MockDpsnClient = jest.fn().mockImplementation(() => {
  return mockDpsnClient;
});

export default MockDpsnClient;
