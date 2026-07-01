const functions = require('firebase-functions');
const admin = require('firebase-admin');

const serviceAccount = {
  ...(require('./service-account.json') || {}),
  private_key: (
    process.env.FIREBASE_PRIVATE_KEY ||
    require('./service-account.json').private_key ||
    ''
  ).replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.sendTaskReminder = functions.https.onRequest(async (req, res) => {
  try {
    const { token, title, body, data } = req.body || {};

    if (!token) {
      res.status(400).json({ success: false, message: 'Missing token' });
      return;
    }

    const message = {
      token,
      notification: {
        title: title || 'Task Reminder',
        body: body || 'You have a task due soon.',
      },
      data: data || {},
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('sendTaskReminder error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to send reminder' });
  }
});
