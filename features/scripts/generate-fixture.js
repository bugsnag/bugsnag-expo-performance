import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { resolve } from 'node:path'

// Validate environment variables
if (!process.env.EXPO_VERSION) {
  console.error('Please provide an Expo version')
  process.exit(1)
}

if (!process.env.EXPO_EAS_PROJECT_ID) {
  console.error('EXPO_EAS_PROJECT_ID is not set')
  process.exit(1)
}

if (!process.env.EXPO_CREDENTIALS_DIR) {
  console.error('EXPO_CREDENTIALS_DIR is not set')
  process.exit(1)
}

// Configuration
const rootDir = resolve(import.meta.dirname, '../../')
const expoVersion = process.env.EXPO_VERSION
const buildDir = resolve(rootDir, `features/fixtures/generated/${expoVersion}`)

const easWorkingDir = `${buildDir}/build`
const fixtureDir = `${buildDir}/test-fixture`

// Dependencies
const fixtureDeps = [
  '@react-native-community/netinfo',
  'expo-file-system',
  'expo-build-properties',
]

// Build package
execFileSync('npm', ['ci'], { cwd: rootDir, stdio: 'inherit' })
execFileSync('npm', ['run', 'build'], { cwd: rootDir, stdio: 'inherit' })

// Generate fixture
if (!process.env.SKIP_GENERATE_FIXTURE) {
  // Clean directories
  cleanDirectory(fixtureDir)
  cleanDirectory(easWorkingDir)
  ensureDirectory(fixtureDir)

  // create the test fixture
  const expoInitArgs = [
    'create-expo-app',
    'test-fixture',
    '--no-install',
    '--template',
    `tabs@${expoVersion}`,
  ]
  execFileSync('npx', expoInitArgs, { cwd: buildDir, stdio: 'inherit' })

  // pack the SDK into the fixture directory
  execFileSync('npm', ['pack', '--pack-destination', fixtureDir], {
    cwd: rootDir,
    stdio: 'inherit',
  })

  // install the fixture dependencies
  const tarballs = fs.globSync('bugsnag-expo-performance-*.tgz', {
    cwd: fixtureDir,
  })
  if (tarballs.length === 0) {
    throw new Error('bugsnag-expo-performance-*.tgz file not found')
  }

  const installArgs = [
    'install',
    '--save',
    '--no-audit',
    ...fixtureDeps,
    ...tarballs,
  ]
  execFileSync('npm', installArgs, { cwd: fixtureDir, stdio: 'inherit' })

  // modify the app.json file
  const appConfig = JSON.parse(
    fs.readFileSync(`${fixtureDir}/app.json`, 'utf8'),
  )
  appConfig.expo.ios = {
    ...appConfig.expo.ios,
    bundleIdentifier: 'com.bugsnag.expo.fixture',
    buildNumber: '1',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  }

  appConfig.expo.android = {
    ...appConfig.expo.android,
    package: 'com.bugsnag.expo.fixture',
    versionCode: 1,
    permissions: ['INTERNET'],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  }

  // set usesCleartextTraffic to true for Android
  appConfig.expo.plugins.push([
    'expo-build-properties',
    {
      android: {
        usesCleartextTraffic: true,
      },
    },
  ])

  // set the Bugsnag API key and app version
  appConfig.expo.version = '1.0.0'
  appConfig.expo.extra = {
    ...appConfig.expo.extra,
    bugsnag: {
      apiKey: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    },
  }

  fs.writeFileSync(`${fixtureDir}/app.json`, JSON.stringify(appConfig, null, 2))

  // eas init
  const easInitArgs = [
    'eas-cli@latest',
    'init',
    '--id',
    `${process.env.EXPO_EAS_PROJECT_ID}`,
  ]
  execFileSync('npx', easInitArgs, { cwd: fixtureDir, stdio: 'inherit' })

  // eas build configure
  const easBuildConfigArgs = [
    'eas-cli@latest',
    'build:configure',
    '--platform',
    'all',
  ]
  execFileSync('npx', easBuildConfigArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: { ...process.env, EAS_NO_VCS: 1 },
  })

  // modify the eas.json file
  const easConfig = JSON.parse(
    fs.readFileSync(`${fixtureDir}/eas.json`, 'utf8'),
  )

  easConfig.cli.appVersionSource = 'local'
  easConfig.build.production = {
    distribution: 'internal',
    credentialsSource: 'local',
    android: {
      buildType: 'apk',
    },
    ios: {
      enterpriseProvisioning: 'universal',
    },
  }

  fs.writeFileSync(`${fixtureDir}/eas.json`, JSON.stringify(easConfig, null, 2))

  // TODO: switch to blank template?
  // // replace the fixture's tabs directory with our own routes
  // // most of these are for expo router tests but need to be injected into the fixture
  // // because expo-router is file-based
  // const fixtureTabsDir = resolve(fixtureDir, 'app/(tabs)')
  // fs.rmSync(fixtureTabsDir, { recursive: true, force: true })

  // const replacementTabsDir = resolve(
  //   rootDir,
  //   `test/react-native/features/fixtures/expo/tabs`,
  // )
  // fs.cpSync(replacementTabsDir, fixtureTabsDir, { recursive: true })

  // copy keystore to the fixture directory
  const keyStorePath = resolve(
    rootDir,
    `features/fixtures/replacements/fakekeys.jks`,
  )
  fs.copyFileSync(keyStorePath, resolve(fixtureDir, 'fakekeys.jks'))

  // TODO: is this needed?
  // // add .npmrc
  // fs.writeFileSync(
  //   resolve(fixtureDir, '.npmrc'),
  //   'registry=https://registry.npmjs.org/\n',
  // )

  // copy credentials to the fixture directory
  const credentialsFiles = fs.readdirSync(process.env.EXPO_CREDENTIALS_DIR)

  for (const file of credentialsFiles) {
    fs.copyFileSync(
      resolve(process.env.EXPO_CREDENTIALS_DIR, file),
      resolve(fixtureDir, file),
    )
  }
}

// Build platform fixtures
if (process.env.BUILD_ANDROID === 'true' || process.env.BUILD_ANDROID === '1') {
  const easBuildArgs = [
    'eas-cli@latest',
    'build',
    '--local',
    '--platform',
    'android',
    '--profile',
    'production',
    '--output',
    'output.apk',
  ]
  execFileSync('npx', easBuildArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EAS_LOCAL_BUILD_WORKINGDIR: easWorkingDir,
      EAS_LOCAL_BUILD_SKIP_CLEANUP: 1,
      EAS_NO_VCS: 1,
      EAS_PROJECT_ROOT: fixtureDir,
    },
  })
}

if (process.env.BUILD_IOS === 'true' || process.env.BUILD_IOS === '1') {
  const easBuildArgs = [
    'eas-cli@latest',
    'build',
    '--local',
    '--platform',
    'ios',
    '--profile',
    'production',
    '--output',
    'output.ipa',
    '--non-interactive',
  ]
  execFileSync('npx', easBuildArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EAS_LOCAL_BUILD_WORKINGDIR: easWorkingDir,
      EAS_LOCAL_BUILD_SKIP_CLEANUP: 1,
      EAS_NO_VCS: 1,
      EAS_PROJECT_ROOT: fixtureDir,
    },
  })
}

// Utility functions
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
