import { Platform } from 'react-native'
// @ts-expect-error - this module is only installed in the generated test fixture
import { FileSystem } from 'react-native-file-access'
import { getMazeRunnerAddress } from '../features/fixtures/replacements/utils/ConfigFileReader'

jest.mock(
  'react-native-file-access',
  () => ({
    Dirs: { DocumentDir: '/app/Documents' },
    FileSystem: { exists: jest.fn(), readFile: jest.fn() },
  }),
  { virtual: true },
)

const ANDROID_TMP_CONFIG = '/data/local/tmp/fixture_config.json'
const ANDROID_FILES_CONFIG =
  '/sdcard/Android/data/com.bugsnag.expo.fixture/files/fixture_config.json'
const IOS_CONFIG = '/app/Documents/fixture_config.json'

const setPlatform = (os: string) => {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true })
}

const mockExists = FileSystem.exists as jest.Mock
const mockReadFile = FileSystem.readFile as jest.Mock

describe('getMazeRunnerAddress', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockExists.mockReset()
    mockReadFile.mockReset()
    setPlatform('android')
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('reads the address from the directory Maze Runner pushes to on Android', async () => {
    mockExists.mockImplementation(
      async (path: string) => path === ANDROID_TMP_CONFIG,
    )
    mockReadFile.mockResolvedValue('{"maze_address":"10.0.0.1:9339"}')

    await expect(getMazeRunnerAddress()).resolves.toBe('10.0.0.1:9339')
    expect(mockReadFile).toHaveBeenCalledWith(ANDROID_TMP_CONFIG)
  })

  it('falls back to the external files directory when /data/local/tmp is unreadable', async () => {
    mockExists.mockImplementation(async (path: string) => {
      if (path === ANDROID_TMP_CONFIG) {
        throw new Error('Permission denied')
      }

      return path === ANDROID_FILES_CONFIG
    })
    mockReadFile.mockResolvedValue('{"maze_address":"10.0.0.2:9339"}')

    await expect(getMazeRunnerAddress()).resolves.toBe('10.0.0.2:9339')
    expect(mockReadFile).toHaveBeenCalledWith(ANDROID_FILES_CONFIG)
  })

  it('reads the address from the documents directory on iOS', async () => {
    setPlatform('ios')
    mockExists.mockImplementation(async (path: string) => path === IOS_CONFIG)
    mockReadFile.mockResolvedValue('{"maze_address":"10.0.0.3:9339"}')

    await expect(getMazeRunnerAddress()).resolves.toBe('10.0.0.3:9339')
    expect(mockReadFile).toHaveBeenCalledWith(IOS_CONFIG)
  })

  it('polls until the config file appears', async () => {
    mockExists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true)
    mockReadFile.mockResolvedValue('{"maze_address":"10.0.0.4:9339"}')

    await expect(getMazeRunnerAddress()).resolves.toBe('10.0.0.4:9339')
    expect(mockExists.mock.calls.length).toBeGreaterThan(4)
  })

  it('ignores a config file that does not contain an address', async () => {
    mockExists.mockResolvedValue(true)
    mockReadFile
      .mockResolvedValueOnce('{}')
      .mockResolvedValueOnce('not json')
      .mockResolvedValue('{"maze_address":"10.0.0.5:9339"}')

    await expect(getMazeRunnerAddress()).resolves.toBe('10.0.0.5:9339')
  })

  it('falls back to localhost when no config file is found within the timeout', async () => {
    const startTime = Date.now()
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(startTime + 30000)
      .mockReturnValue(startTime + 60000)
    mockExists.mockResolvedValue(false)

    await expect(getMazeRunnerAddress()).resolves.toBe('localhost:9339')
    expect(mockReadFile).not.toHaveBeenCalled()
  })
})
