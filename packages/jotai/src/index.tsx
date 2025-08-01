import { atom, PrimitiveAtom } from 'jotai'
import React, { createContext, ReactNode, useContext, useMemo, useRef } from 'react'

import { useAtom, useAtomValue, useSetAtom } from 'jotai/react'
import { Logger, LogLevel, ConsoleLogger, getLogLevelFromEnv } from '@context-action/logger'

type AtomType<T> = PrimitiveAtom<T>

interface AtomContextType<T> {
  atomRef: React.MutableRefObject<AtomType<T>>
  logger: Logger
}

/**
 * Configuration options for createAtomContext
 */
export interface AtomContextConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger
  /** Log level for the logger. Defaults to ERROR if not provided */
  logLevel?: LogLevel
}

/**
 * Jotai atom을 Context로 공유할 수 있는 헬퍼 함수
 * @param initialValue atom의 초기값
 * @returns Provider, hooks를 포함한 객체
 */
export function createAtomContext<T>(initialValue: T) {
  // 기본 로거 설정
  const envLogLevel = getLogLevelFromEnv()
  const logger = new ConsoleLogger(envLogLevel)

  const AtomContext = createContext<AtomContextType<T> | null>(null)

  // Provider 컴포넌트
  const Provider = ({ children }: { children: ReactNode }) => {
    const atomRef = useRef(atom(initialValue)) as React.MutableRefObject<AtomType<T>>
    
    logger.debug('AtomContext Provider initialized', { 
      initialValue,
      logLevel: envLogLevel
    })
    
    return (
      <AtomContext.Provider value={{ atomRef, logger }}>
        {children}
      </AtomContext.Provider>
    )
  }

  // Context 접근 hook
  const useAtomContext = () => {
    const context = useContext(AtomContext)
    if (!context) {
      throw new Error('useAtomContext must be used within Provider')
    }
    return context
  }

  // atom 값과 setter를 모두 반환하는 hook
  const useAtomState = () => {
    const { atomRef, logger } = useAtomContext()
    const [value, setValue] = useAtom(atomRef.current)
    
    logger.debug('useAtomState called', { 
      atomValue: value,
      hasSetter: !!setValue 
    })
    
    return [value, setValue] as const
  }

  // atom 값만 반환하는 hook
  const useAtomReadOnly = () => {
    const { atomRef, logger } = useAtomContext()
    const value = useAtomValue(atomRef.current)
    
    logger.debug('useAtomReadOnly called', { atomValue: value })
    
    return value
  }

  const useAtomSelect = <R,>(callback: (item: T) => R) => {
    const { atomRef, logger } = useAtomContext()
    const derivedAtom = useMemo(
      () => atom((get) => callback(get(atomRef.current))),
      [atomRef, callback]
    )
    const value = useAtomValue(derivedAtom)
    
    logger.debug('useAtomSelect called', { 
      originalValue: atomRef.current,
      derivedValue: value 
    })
    
    return value
  }

  // atom setter만 반환하는 hook
  const useAtomSetter = () => {
    const { atomRef, logger } = useAtomContext()
    const setValue = useSetAtom(atomRef.current)
    
    logger.debug('useAtomSetter called', { 
      hasSetter: !!setValue 
    })
    
    return setValue
  }

  return {
    Provider,
    useAtomContext,
    useAtomState,
    useAtomReadOnly,
    useAtomSelect,
    useAtomSetter,
  }
}

