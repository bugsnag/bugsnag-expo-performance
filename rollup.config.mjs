import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
  },
  external: [
    '@bugsnag/react-native-performance',
    'react',
    'react-native',
    'expo-constants',
  ],
  plugins: [typescript()],
}
