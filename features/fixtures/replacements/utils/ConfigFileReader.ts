import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 5000
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getMazeRunnerAddress = async (): Promise<string> => {
  const startTime = Date.now()

  const candidateDirs =
    Platform.OS === 'android'
      ? [
          '/sdcard/Android/data/com.bugsnag.expo.fixture/files',
          Dirs.DocumentDir,
          Dirs.CacheDir,
          '/sdcard',
          '/storage/emulated/0',
          '/data/local/tmp',
        ].filter(Boolean)
      : [Dirs.DocumentDir, Dirs.CacheDir]

  const candidateFiles = ['fixture_config.json', 'maze_address', 'bs-host.json']

  while (Date.now() - startTime < TIMEOUT) {
    for (const dir of candidateDirs) {
      for (const fileName of candidateFiles) {
        const configFilePath = `${dir}/${fileName}`

        try {
          const configFileExists = await FileSystem.exists(configFilePath)

          if (configFileExists) {
            const contents = (await FileSystem.readFile(configFilePath)).trim()
            console.error(
              `[BugsnagPerformance] found config file at '${configFilePath}': ${contents}`,
            )

            // Attempt JSON parse first (fixture_config.json)
            try {
              const parsed = JSON.parse(contents)
              if (parsed?.maze_address) {
                return `${parsed.maze_address}`
              }
            } catch {
              // Plain-text address fallback (maze_address file)
              if (contents.length > 0) {
                return contents.replace(/^https?:\/\//, '').replace(/\/$/, '')
              }
            }
          }
        } catch (_err) {
          // Continue searching remaining candidate paths
        }
      }
    }

    await delay(300)
  }

  console.error(
    `[BugsnagPerformance] no config file found within ${TIMEOUT}ms across candidate directories, falling back to 'localhost:9339'`,
  )
  return 'localhost:9339'
}