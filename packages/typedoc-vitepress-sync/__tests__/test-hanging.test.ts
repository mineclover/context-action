import { TypeDocVitePressSync } from '../src/index.js'
import type { SyncConfig } from '../src/types/index.js'
import fs from 'fs'
import path from 'path'

describe('Test Hanging Issue', () => {
  const testDir = './.test-hanging'
  const sourceDir = path.join(testDir, 'source')
  const targetDir = path.join(testDir, 'target')
  const cacheDir = path.join(testDir, 'cache')

  const config: SyncConfig = {
    sourceDir,
    targetDir,
    packageMapping: {
      'test-package': 'test'
    },
    cache: {
      enabled: true,
      dir: cacheDir,
      ttl: 60000
    }
  }

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(path.join(sourceDir, 'packages', 'test-package'), { recursive: true })
    fs.mkdirSync(targetDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should create and destroy without hanging', async () => {
    const sync = new TypeDocVitePressSync(config)
    expect(sync).toBeInstanceOf(TypeDocVitePressSync)
    await sync.destroy()
  })

  it('should not hang after sync operation', async () => {
    const sync = new TypeDocVitePressSync(config)
    
    // Create a test file
    const packageDir = path.join(sourceDir, 'packages', 'test-package')
    fs.writeFileSync(path.join(packageDir, 'test.md'), '# Test')
    
    await sync.sync()
    await sync.destroy()
  })

  it('should clean up event listeners', async () => {
    const sync = new TypeDocVitePressSync(config)
    
    let eventFired = false
    const listener = () => { eventFired = true }
    
    sync.on('start', listener)
    sync.off('start', listener)
    
    // @ts-ignore - accessing private method for testing
    sync.emit('start', config)
    
    expect(eventFired).toBe(false)
    await sync.destroy()
  })
})