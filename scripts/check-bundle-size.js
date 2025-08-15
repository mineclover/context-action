#!/usr/bin/env node
import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

class BundleSizeChecker {
  constructor() {
    this.packages = ['core', 'react'];
    this.report = {
      timestamp: new Date().toISOString(),
      totalSize: 0,
      totalSizeFormatted: '',
      packages: {}
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(ext) {
    const typeMap = {
      '.js': 'JavaScript',
      '.cjs': 'CommonJS',
      '.mjs': 'ES Module',
      '.d.ts': 'TypeScript Declaration',
      '.d.cts': 'CommonJS Declaration',
      '.map': 'Source Map'
    };
    return typeMap[ext] || 'Unknown';
  }

  checkPackage(packageName) {
    const packagePath = resolve(PROJECT_ROOT, 'packages', packageName);
    const distPath = resolve(packagePath, 'dist');
    
    try {
      // 패키지 정보 읽기
      const packageJson = JSON.parse(
        readFileSync(resolve(packagePath, 'package.json'), 'utf8')
      );
      
      const files = readdirSync(distPath, { recursive: true });
      let totalSize = 0;
      const fileDetails = {};
      
      for (const file of files) {
        const filePath = resolve(distPath, file);
        const stat = statSync(filePath);
        
        if (stat.isFile()) {
          const size = stat.size;
          const ext = extname(file);
          
          fileDetails[file] = {
            size,
            sizeFormatted: this.formatBytes(size),
            type: this.getFileType(ext)
          };
          
          // .map 파일은 번들 크기에서 제외
          if (!file.endsWith('.map')) {
            totalSize += size;
          }
        }
      }
      
      return {
        name: packageName,
        version: packageJson.version,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
        sizeKB: Math.round((totalSize / 1024) * 100) / 100,
        files: fileDetails
      };
      
    } catch (error) {
      return {
        name: packageName,
        error: `Build not found (run 'pnpm build:${packageName}' first)`
      };
    }
  }

  run() {
    console.log('📦 Bundle Size Analysis');
    console.log('='.repeat(40));
    
    let hasErrors = false;
    
    for (const pkg of this.packages) {
      const result = this.checkPackage(pkg);
      
      if (result.error) {
        console.log(`❌ ${pkg.padEnd(8)} ${result.error}`);
        hasErrors = true;
        this.report.packages[pkg] = { error: result.error };
      } else {
        console.log(`📊 ${pkg.padEnd(8)} ${result.sizeFormatted.padEnd(8)} (v${result.version})`);
        
        this.report.packages[pkg] = {
          version: result.version,
          size: result.size,
          sizeFormatted: result.sizeFormatted,
          sizeKB: result.sizeKB,
          files: result.files
        };
        
        this.report.totalSize += result.size;
      }
    }
    
    this.report.totalSizeFormatted = this.formatBytes(this.report.totalSize);
    
    console.log('='.repeat(40));
    console.log(`📋 Total Size: ${this.report.totalSizeFormatted}`);
    
    // JSON 리포트 저장
    this.saveReport();
    
    if (hasErrors) {
      console.log('❌ Some packages missing builds');
      process.exit(1);
    } else {
      console.log('✅ Bundle size analysis completed');
    }
  }

  saveReport() {
    try {
      const reportPath = resolve(PROJECT_ROOT, 'reports', 'bundle-size.json');
      
      writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
      console.log(`📄 Report saved: reports/bundle-size.json`);
    } catch (error) {
      console.warn('⚠️  Could not save report:', error.message);
    }
  }
}

// 메인 실행
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const checker = new BundleSizeChecker();
  checker.run();  
}

export default BundleSizeChecker;