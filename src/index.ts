import type {
  BugsnagPerformance,
  Clock,
  SpanContextStorage,
} from '@bugsnag/core-performance'
import type {
  ReactNativeConfiguration,
  ReactNativeSpanFactory,
} from '@bugsnag/react-native-performance'
import ReactNativePerformance, {
  createDefaultPlatformExtensions,
  createReactNativeClient,
  registerClient,
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

  return rest
}

type PlatformExtensions = ReturnType<typeof createPlatformExtensions>

const expoClient = createReactNativeClient({
  schema,
  createPlatformExtensions,
})

// Register the Expo client as the singleton instance.
// This ensures that this client instance is used even when
// BugsnagPerformance is imported from @bugsnag/react-native-performance
registerClient(expoClient)

export default ReactNativePerformance as BugsnagPerformance<
  ReactNativeConfiguration,
  PlatformExtensions
>
