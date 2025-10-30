/* global __DEV__ */
import { createReactNativeSchema } from '@bugsnag/react-native-performance'
import Constants from 'expo-constants'

// If the developer property is not present it means the app is
// not connected to a development tool and is either a published app running in
// the Expo client, or a standalone app
const IS_PRODUCTION =
  !Constants.expoConfig?.developmentClient && !Constants.expoGoConfig?.developer

// The app can still run in production "mode" in development environments, in which
// cases the global boolean __DEV__ will be set to true
const IS_PRODUCTION_MODE = typeof __DEV__ === 'undefined' || __DEV__ !== true

const isDevelopment = !IS_PRODUCTION || !IS_PRODUCTION_MODE

const schema = createReactNativeSchema(isDevelopment)

// Set default values from Expo Constants
schema.apiKey.defaultValue = Constants.expoConfig?.extra?.bugsnag?.apiKey || ''
schema.appVersion.defaultValue = Constants.expoConfig?.version || ''

// Disable auto instrumentation of app starts by default in Expo apps (use withInstrumentedAppStarts HOC instead)
schema.autoInstrumentAppStarts.defaultValue = false

export { schema }
