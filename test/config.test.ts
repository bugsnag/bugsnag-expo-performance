const mockCreateReactNativeSchema = jest.fn(() => {
  return {
    apiKey: {
      defaultValue: '',
    },
    appVersion: {
      defaultValue: '',
    },
    autoInstrumentAppStarts: {
      defaultValue: true,
    },
  }
})

jest.mock('@bugsnag/react-native-performance', () => ({
  createReactNativeSchema: mockCreateReactNativeSchema,
}))

describe('config', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('isDevelopment detection', () => {
    afterAll(() => {
      // Reset to default state (production)
      // @ts-expect-error global implicitly has type 'any'
      global.__DEV__ = false
    })

    describe('when __DEV__ = false (production mode)', () => {
      beforeAll(() => {
        // @ts-expect-error global implicitly has type 'any'
        global.__DEV__ = false
      })

      it('should detect production environment when developmentClient and developer are not present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(false)
      })

      it('should detect development environment when developmentClient is present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: { developmentClient: true },
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })

      it('should detect development environment when developer is present in expoGoConfig', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: { developer: true },
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })
    })

    describe('when __DEV__ = true (development mode)', () => {
      beforeAll(() => {
        // @ts-expect-error global implicitly has type 'any'
        global.__DEV__ = true
      })

      it('should detect development environment when developmentClient and developer are not present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })

      it('should detect development environment when developmentClient is present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: { developmentClient: true },
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })

      it('should detect development environment when developer is present in expoGoConfig', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: { developer: true },
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })
    })

    describe('when __DEV__ is undefined (production mode)', () => {
      beforeAll(() => {
        // @ts-expect-error global implicitly has type 'any'
        delete global.__DEV__
      })

      it('should detect production environment when developmentClient and developer are not present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(false)
      })

      it('should detect development environment when developmentClient is present', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: { developmentClient: true },
          expoGoConfig: null,
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })

      it('should detect development environment when developer is present in expoGoConfig', () => {
        jest.mock('expo-constants', () => ({
          expoConfig: {},
          expoGoConfig: { developer: true },
        }))

        require('../src/config')
        expect(mockCreateReactNativeSchema).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('schema default values', () => {
    it('should set apiKey from expoConfig.extra.bugsnag.apiKey', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {
          extra: {
            bugsnag: {
              apiKey: 'test-api-key-123',
            },
          },
        },
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.apiKey.defaultValue).toBe('test-api-key-123')
    })

    it('should set empty string for apiKey when not configured', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {},
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.apiKey.defaultValue).toBe('')
    })

    it('should set empty string for apiKey when expoConfig is undefined', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: undefined,
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.apiKey.defaultValue).toBe('')
    })

    it('should set appVersion from expoConfig.version', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {
          version: '1.2.3',
        },
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.appVersion.defaultValue).toBe('1.2.3')
    })

    it('should set empty string for appVersion when not configured', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {},
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.appVersion.defaultValue).toBe('')
    })

    it('should set empty string for appVersion when expoConfig is undefined', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: undefined,
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.appVersion.defaultValue).toBe('')
    })

    it('should disable autoInstrumentAppStarts by default', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {},
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.autoInstrumentAppStarts.defaultValue).toBe(false)
    })

    it('should set all default values correctly with full config', () => {
      jest.mock('expo-constants', () => ({
        expoConfig: {
          version: '2.0.0',
          extra: {
            bugsnag: {
              apiKey: 'full-config-key',
            },
          },
        },
        expoGoConfig: null,
      }))

      const { schema } = require('../src/config')
      expect(schema.apiKey.defaultValue).toBe('full-config-key')
      expect(schema.appVersion.defaultValue).toBe('2.0.0')
      expect(schema.autoInstrumentAppStarts.defaultValue).toBe(false)
    })
  })
})
