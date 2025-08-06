import { TrustBrokerClient } from 'trustbroker-client'; // Assuming your SDK is in node_modules

// This creates a single, shared instance of the TrustBrokerClient.
// It will be initialized once when the server starts.
const trustBrokerClient = new TrustBrokerClient({
  logger: console, // Use the standard console for logging
});

export default trustBrokerClient;
