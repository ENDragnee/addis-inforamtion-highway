import { TrustBrokerClient } from 'trustbroker-client'; // Assuming your SDK is in node_modules

const trustBrokerClient = new TrustBrokerClient({
  logger: console, // Use the standard console for logging
});

export default trustBrokerClient;
