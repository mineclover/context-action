/**
 * @fileoverview Console logger implementation
 */

import type { Logger, LogLevel } from '../types/index.js'

export class ConsoleLogger implements Logger {
  private level: LogLevel
  private useColors: boolean

  constructor(level: LogLevel = 'info', useColors: boolean = true) {
    this.level = level
    this.useColors = useColors && process.stdout.isTTY
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levels[level] >= levels[this.level]
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const prefix = this.useColors ? this.getColoredPrefix(level) : `[${level.toUpperCase()}]`
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : ''
    
    return `${prefix} ${message}${formattedArgs}`
  }

  private getColoredPrefix(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m[DEBUG]\x1b[0m', // Cyan
      info: '\x1b[32m[INFO]\x1b[0m',   // Green
      warn: '\x1b[33m[WARN]\x1b[0m',   // Yellow
      error: '\x1b[31m[ERROR]\x1b[0m'  // Red
    }
    
    return colors[level]
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, ...args))
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, ...args))
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args))
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args))
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  setUseColors(useColors: boolean): void {
    this.useColors = useColors && process.stdout.isTTY
  }
}