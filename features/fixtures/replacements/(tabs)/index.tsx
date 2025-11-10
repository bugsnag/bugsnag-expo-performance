import BugsnagPerformance from '@bugsnag/expo-performance'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Text, View } from '@/components/Themed'
import { getMazeRunnerAddress } from '@/utils/ConfigFileReader'

export default function TabOneScreen() {
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const mazeAddress = await getMazeRunnerAddress()

      BugsnagPerformance.start({
        endpoint: `http://${mazeAddress}/traces`,
      })

      setTimeout(() => {
        router.navigate('./two')
      }, 250)
    })()
  }, [router.navigate])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
})
