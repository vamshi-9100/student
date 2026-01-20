// Service Worker for Firebase Cloud Messaging
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

let firebaseConfig = null

async function loadFirebaseConfig() {
  if (firebaseConfig) return firebaseConfig
  try {
    const resp = await fetch('/api/firebase-config')
    if (!resp.ok) {
      console.warn('[firebase-messaging-sw.js] Failed to load config')
      return null
    }
    firebaseConfig = await resp.json()
    return firebaseConfig
  } catch (err) {
    console.error('[firebase-messaging-sw.js] Error loading config', err)
    return null
  }
}

async function ensureFirebase() {
  const cfg = await loadFirebaseConfig()
  if (!cfg) return null
  try {
    firebase.initializeApp(cfg)
    return firebase.messaging()
  } catch (err) {
    console.error('[firebase-messaging-sw.js] Failed to init firebase', err)
    return null
  }
}

let messagingPromise = ensureFirebase()

// Handle background messages
async function handleBackgroundMessage(payload) {
  console.log('[firebase-messaging-sw.js] ✅ Received background message:', payload)
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Alert'
  const notificationBody = payload.notification?.body || payload.data?.message || payload.data?.alertMessage || 'New alert received'
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      ...payload.data,
      ...payload.notification,
      click_action: '/dashboard/alerts',
      fcmMessageId: payload.fcmMessageId,
    },
    requireInteraction: true,
    tag: 'iot-alert',
  }

  // Show notification
  const notificationPromise = self.registration.showNotification(notificationTitle, notificationOptions)
  
  // Also send message to all clients (if app is open)
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'FCM_MESSAGE',
        payload: payload,
        notification: payload.notification,
        data: payload.data,
      })
    })
  })
  
  return notificationPromise
}

// Register background handler once messaging is ready
messagingPromise.then((messaging) => {
  if (!messaging) return
  messaging.onBackgroundMessage(handleBackgroundMessage)
}).catch((err) => {
  console.error('[firebase-messaging-sw.js] Failed to set background handler', err)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event)
  
  event.notification.close()
  
  // Open the app to alerts page
  event.waitUntil(
    clients.openWindow('/dashboard/alerts')
  )
})

