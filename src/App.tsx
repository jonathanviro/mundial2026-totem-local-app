import { useStore } from './store'
import { SplashScreen }   from './screens/SplashScreen'
import { ConfigScreen }   from './screens/ConfigScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { PredictScreen }  from './screens/PredictScreen'
import { ConfirmScreen }  from './screens/ConfirmScreen'
import { SuccessScreen }  from './screens/SuccessScreen'
import './index.css'

export default function App() {
  const { screen } = useStore()
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {screen === 'splash'   && <SplashScreen />}
      {screen === 'config'   && <ConfigScreen />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'predict'  && <PredictScreen />}
      {screen === 'confirm'  && <ConfirmScreen />}
      {screen === 'success'  && <SuccessScreen />}
    </div>
  )
}
