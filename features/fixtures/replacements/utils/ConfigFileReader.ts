import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getMazeRunnerAddress = async () => {
  const startTime = Date.now()

  // Poll for the config file across possible candidate locations
  while (Date.now() - startTime < TIMEOUT) {
    const candidateDirs =
      Platform.OS === 'android'
        ? [
            Dirs.DocumentDir,
            Dirs.CacheDir,
            '/sdcard/Android/data/com.bugsnag.expo.fixture/files',
            '/data/local/tmp',
          ]
        : [Dirs.DocumentDir]

    for (const dir of candidateDirs) {
      const configFilePath = `${dir}/fixture_config.json`

      try {
        const configFileExists = await FileSystem.exists(configFilePath)

        if (configFileExists) {
          const configFile = await FileSystem.readFile(configFilePath)
          console.error(
            `[BugsnagPerformance] found config file at '${configFilePath}'. contents: ${configFile}`,
          )
          const config = JSON.parse(configFile)
          if (config && config.maze_address) {
            return `${config.maze_address}`
          }
        }
      } catch (err) {
        // Ignore access errors on individual restricted directories and continue checking others
      }
    }

    await delay(500)
  }

  console.error(
    `[BugsnagPerformance] no config file found across candidate directories within ${TIMEOUT}ms, falling back to 'localhost:9339'`,
  )
  return 'localhost:9339'
}