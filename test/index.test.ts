import type { Clock, SpanContextStorage } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'

const mockSingleton = {}
const mockCreateReactNativeClient = jest.fn()
const mockCreateDefaultPlatformExtensions = jest.fn()
const mockRegisterClient = jest.fn()

jest.mock('@bugsnag/react-native-performance', () => {
  return {
    __esModule: true,
    createReactNativeClient: mockCreateReactNativeClient,
    createDefaultPlatformExtensions: mockCreateDefaultPlatformExtensions,
    registerClient: mockRegisterClient,
    default: mockSingleton,
  }
})

const mockSchema = {
  apiKey: {
    defaultValue: '',
  },
  appVersion: {
    defaultValue: '',
  },
  autoInstrumentAppStarts: {
    defaultValue: false,
  },
}

jest.mock('../src/config', () => ({
  schema: mockSchema,
}))

describe('index', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should create a React Native client with the correct schema', () => {
    require('../src/index')

    expect(mockCreateReactNativeClient).toHaveBeenCalledTimes(1)
    expect(mockCreateReactNativeClient).toHaveBeenCalledWith({
      schema: mockSchema,
      createPlatformExtensions: expect.any(Function),
    })
  })

  it('should call registerClient', () => {
    require('../src/index')

    expect(mockRegisterClient).toHaveBeenCalledTimes(1)
  })

  it('should re-export the default from react-native-performance (client proxy singleton)', () => {
    const indexModule = require('../src/index')
    expect(indexModule.default).toBe(mockSingleton)
  })

  it('should pass a createPlatformExtensions function that removes the attach method', () => {
    require('../src/index')

    // Extract the createPlatformExtensions function that index.ts passed to createReactNativeClient
    // This is the actual implementation we want to test
    const clientOptions = mockCreateReactNativeClient.mock.calls[0][0]
    const createExpoPlatformExtensions = clientOptions.createPlatformExtensions

    // Set up mock return value for createDefaultPlatformExtensions
    // Simulating what the real function would return: an object with 'attach' plus other extensions
    const mockAttach = jest.fn()
    const mockExtension1 = jest.fn()
    const mockExtension2 = jest.fn()

    mockCreateDefaultPlatformExtensions.mockReturnValue({
      attach: mockAttach,
      extension1: mockExtension1,
      extension2: mockExtension2,
    })

    // Now call the extracted function to test its behavior
    const mockAppStartTime = 1000
    const mockClock = {} as Clock
    const mockSpanFactory = {} as ReactNativeSpanFactory
    const mockSpanContextStorage = {} as SpanContextStorage

    const platformExtensions = createExpoPlatformExtensions(
      mockAppStartTime,
      mockClock,
      mockSpanFactory,
      mockSpanContextStorage,
    )

    // Verify createDefaultPlatformExtensions was called with the correct parameters
    expect(mockCreateDefaultPlatformExtensions).toHaveBeenCalledWith(
      mockAppStartTime,
      mockClock,
      mockSpanFactory,
      mockSpanContextStorage,
    )

    // 'attach' should be filtered out
    expect(platformExtensions).not.toHaveProperty('attach')

    // All other extensions should be preserved
    expect(platformExtensions).toHaveProperty('extension1', mockExtension1)
    expect(platformExtensions).toHaveProperty('extension2', mockExtension2)
  })
})
