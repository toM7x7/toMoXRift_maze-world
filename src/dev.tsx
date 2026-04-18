/**
 * 開発環境用エントリーポイント
 *
 * ローカル開発時（npm run dev）に使用されます。
 * 本番ビルド（npm run build）では使用されません。
 */

import { DevEnvironment, XRiftProvider } from '@xrift/world-components'
import type { CameraConfig, PhysicsConfig } from '@xrift/world-components'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { World } from './World'
import xriftConfig from '../xrift.json'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const physicsConfig: PhysicsConfig | undefined = (
  xriftConfig as { physics?: PhysicsConfig }
).physics

const cameraConfig: CameraConfig | undefined = (
  xriftConfig as { camera?: CameraConfig }
).camera

const devSpawnPosition: [number, number, number] = [0, 1.6, 18]

createRoot(rootElement).render(
  <StrictMode>
    <XRiftProvider baseUrl="/">
      <DevEnvironment
        physicsConfig={physicsConfig}
        camera={cameraConfig}
        spawnPosition={devSpawnPosition}
      >
        <World />
      </DevEnvironment>
    </XRiftProvider>
  </StrictMode>,
)
