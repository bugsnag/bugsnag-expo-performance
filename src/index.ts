import type { Clock, SpanContextStorage } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import {
  createDefaultPlatformExtensions,
  createReactNativeClient,
} from '@bugsnag/react-native-performance'
import { schema } from './config'

// Create platform extensions but omit the 'attach' method
const createPlatformExtensions = (
  appStartTime: number,
  clock: Clock,
  spanFactory: ReactNativeSpanFactory,
  spanContextStorage: SpanContextStorage,
) => {
  const { attach: _attach, ...rest } = createDefaultPlatformExtensions(
    appStartTime,
    clock,
    spanFactory,
    spanContextStorage,
  )

  return {
    ...rest,
  }
}

const BugsnagPerformance = createReactNativeClient({
  schema,
  createPlatformExtensions,
})

export default BugsnagPerformance
