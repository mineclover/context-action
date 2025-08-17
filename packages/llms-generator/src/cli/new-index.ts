#!/usr/bin/env node

/**
 * 새로운 CLI 구조 - 통합 명령어 시스템
 * 45개 명령어를 15개로 축소하는 리펙토링된 CLI
 */

import { CLIRouter } from './core/CLIRouter.js';
import type { CLIArgs, CLIContext } from './types/CommandTypes.js';
import { existsSync } from 'fs';
import path from 'path';

/**
 * CLI 인자 파싱
 */
function parseArguments(argv: string[]): CLIArgs {
  const args = argv.slice(2);
  
  if (args.length === 0) {
    return {
      command: 'help',
      positional: [],
      options: {},
      flags: {}
    };
  }

  const command = args[0];
  const positional: string[] = [];
  const options: Record<string, any> = {};
  const flags: Record<string, boolean> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Long option: --name=value or --flag
      const [name, value] = arg.slice(2).split('=', 2);
      
      if (value !== undefined) {
        // --name=value
        options[name] = value;
      } else {
        // --flag or --name value
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          // --name value
          options[name] = args[++i];
        } else {
          // --flag
          flags[name] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      // Short option: -n value or -f
      const name = arg.slice(1);
      
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // -n value
        options[name] = args[++i];
      } else {
        // -f
        flags[name] = true;
      }
    } else {
      // Positional argument
      positional.push(arg);
    }
  }

  return {
    command,
    positional,
    options,
    flags
  };
}

/**
 * CLI 컨텍스트 생성
 */
function createContext(): CLIContext {
  const workingDir = process.cwd();
  const configPath = path.join(workingDir, 'llms-generator.config.json');
  
  return {
    workingDir,
    configPath: existsSync(configPath) ? configPath : undefined,
    verbose: false,
    dryRun: false
  };
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    // CLI 인자 파싱
    const args = parseArguments(process.argv);
    
    // 컨텍스트 생성
    const context = createContext();
    
    // 글로벌 플래그 처리
    if (args.flags.verbose || args.flags.v) {
      context.verbose = true;
    }
    
    if (args.flags['dry-run'] || args.flags.dryRun) {
      context.dryRun = true;
    }

    // 도움말 처리 (명령어가 없거나 help인 경우만)
    if (args.command === 'help' || args.command === '--help' || args.flags.help) {
      const router = new CLIRouter(context);
      router.showHelp();
      return;
    }
    
    // 명령어가 없는 경우 도움말 출력
    if (!args.command) {
      const router = new CLIRouter(context);
      router.showHelp();
      return;
    }

    // 버전 정보 처리
    if (args.command === 'version' || args.command === '--version' || args.flags.version) {
      await showVersion();
      return;
    }

    // 라우터 생성 및 명령어 실행
    const router = new CLIRouter(context);
    await router.route(args);

  } catch (error) {
    console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error));
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:');
      console.error(error instanceof Error ? error.stack : error);
    }
    
    process.exit(1);
  }
}

/**
 * 버전 정보 출력
 */
async function showVersion(): Promise<void> {
  try {
    const { promises: fs } = await import('fs');
    const packagePath = path.join(import.meta.dirname || __dirname, '../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
    
    console.log(`@context-action/llms-generator v${packageJson.version}`);
    console.log('New CLI Structure (Refactored)');
  } catch (error) {
    console.log('@context-action/llms-generator (version unknown)');
  }
}

/**
 * 개발 정보 출력
 */
function showDevInfo(): void {
  console.log('\n🔧 Development Mode');
  console.log('New CLI structure with unified commands');
  console.log('Legacy commands are supported with deprecation warnings');
  console.log('Run with --verbose for detailed output');
}

// 개발 모드에서 추가 정보 출력
if (process.env.NODE_ENV === 'development') {
  showDevInfo();
}

// 메인 함수 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, parseArguments, createContext };