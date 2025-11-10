import { Directory, File } from 'expo-file-system'
import { Platform } from 'react-native'

const TIMEOUT = 60000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getMazeRunnerAddress = async () => {
  const startTime = Date.now()
  let configFile: File

  // poll for the config file to exist
  while (Date.now() - startTime < TIMEOUT) {
    const configDirectory =
      Platform.OS === 'android'
        ? new Directory('/data/local/tmp')
        : Directory.documentDirectory

    if (configDirectory.exists) {
      configFile = new File(configDirectory, 'fixture_config.json')
      if (configFile.exists) {
        const configText = await configFile.text()
        console.log(
          `[BugsnagPerformance] found config file at '${configFile.uri}'. contents: ${configText}`,
        )
        const config = JSON.parse(configText)
        return `${config.maze_address}`
      }
    }

    await delay(500)
  }

  console.error(
    `[BugsnagPerformance] no config file found at ${configFile?.uri}, falling back to 'localhost:9339'`,
  )
  return 'localhost:9339'
}
