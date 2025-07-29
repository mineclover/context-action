import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 코어 패키지의 버전을 읽어옵니다
 */
export function getCoreVersion() {
  try {
    const packageJsonPath = join(__dirname, '../../../packages/core/package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version
  } catch (error) {
    console.warn('Failed to read core package version:', error.message)
    return '0.0.0' // fallback version
  }
}

/**
 * React 패키지의 버전을 읽어옵니다
 */
export function getReactVersion() {
  try {
    const packageJsonPath = join(__dirname, '../../../packages/react/package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version
  } catch (error) {
    console.warn('Failed to read react package version:', error.message)
    return '0.0.0' // fallback version
  }
}

/**
 * 최신 버전을 반환합니다 (코어와 React 패키지 중 더 높은 버전)
 */
export function getLatestVersion() {
  const coreVersion = getCoreVersion()
  const reactVersion = getReactVersion()
  
  // 간단한 버전 비교 (semantic versioning)
  const compareVersions = (a, b) => {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      
      if (aPart > bPart) return 1
      if (aPart < bPart) return -1
    }
    return 0
  }
  
  return compareVersions(coreVersion, reactVersion) >= 0 ? coreVersion : reactVersion
}