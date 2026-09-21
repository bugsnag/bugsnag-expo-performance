import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000
const POLL_INTERVAL = 500
const CONFIG_FILE_NAME = 'fixture_config.json'
const FALLBACK_ADDRESS = 'localhost:9339'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Maze Runner writes the config file to the app's documents directory on iOS. On Android it uses
// '/data/local/tmp' when 'Maze.config.android_app_files_directory' is set (as it is for BitBar in
// features/support/env.rb) and the app's external files directory otherwise, so check both.
const getCandidateDirectories = () =>
  Platform.OS === 'android'
    ? ['/data/local/tmp', '/sdcard/Android/data/com.bugsnag.expo.fixture/files']
    : [Dirs.DocumentDir]

const readMazeRunnerAddress = async (directory: string) => {
  const configFilePath = `${directory}/${CONFIG_FILE_NAME}`

  try {
    if (!(await FileSystem.exists(configFilePath))) {
      return undefined
    }

    const configFile = await FileSystem.readFile(configFilePath)
    console.error(
      `[BugsnagPerformance] found config file at '${configFilePath}'. contents: ${configFile}`,
    )

    const config = JSON.parse(configFile)
    return config?.maze_address ? `${config.maze_address}` : undefined
  } catch (_err) {
    // This directory is not readable on this device, try the next candidate
    return undefined
  }
}

export const getMazeRunnerAddress = async () => {
  const startTime = Date.now()

  while (Date.now() - startTime < TIMEOUT) {
    for (const directory of getCandidateDirectories()) {
      const mazeAddress = await readMazeRunnerAddress(directory)

      if (mazeAddress) {
        console.error(
          `[BugsnagPerformance] using Maze Runner address '${mazeAddress}'`,
        )
        return mazeAddress
      }
    }

    await delay(POLL_INTERVAL)
  }

  console.error(
    `[BugsnagPerformance] no config file found across candidate directories within ${TIMEOUT}ms, falling back to '${FALLBACK_ADDRESS}'`,
  )
  return FALLBACK_ADDRESS
}
