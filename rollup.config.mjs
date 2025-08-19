import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    generatedCode: {
      preset: 'es2015',
    },
  },
  external: [
    '@bugsnag/react-native-performance',
    'react',
    'react-native',
    'expo-constants',
  ],
  plugins: [
    typescript({
      // don't output anything if there's a TS error
      noEmitOnError: true,
      // turn on declaration files and declaration maps
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        declarationDir: 'dist/types',
      },
    }),
  ],
  jsx: {
    mode: 'preserve',
    factory: null,
    fragment: null,
    importSource: null,
  },
}
