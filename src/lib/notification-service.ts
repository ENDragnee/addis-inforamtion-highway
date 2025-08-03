import admin from './firebase-admin';

interface ConsentNotificationPayload {
  fcmToken: string;
  requestId: string;
  requesterName: string;
  providerName: string;
  schemaName: string;
}

/**
 * Sends a push notification to a user's device asking for consent.
 */
export async function sendConsentRequestNotification(payload: ConsentNotificationPayload) {
  const { fcmToken, requestId, requesterName, providerName, schemaName } = payload;

  const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: 'New Data Request',
      body: `${requesterName} is requesting your "${schemaName}" data from ${providerName}.`,
    },
    // The 'data' payload is sent to the app for processing, even in the background.
    data: {
      requestId: requestId,
      type: 'CONSENT_REQUEST',
      // This is a common pattern for handling notification taps in Flutter/React Native
      click_action: 'FLUTTER_NOTIFICATION_CLICK', 
    },
    // Apple Push Notification Service specific configuration
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    console.log(`Sending consent notification for request ID: ${requestId} to token: ${fcmToken.substring(0, 20)}...`);
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
    // You might want to add more specific error handling here,
    // e.g., if the token is invalid, you could remove it from the user's record.
  }
}
