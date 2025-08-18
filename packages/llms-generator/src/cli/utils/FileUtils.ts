/**
 * File Utils - Common file operations
 */

import { promises as fs } from 'fs';
import path from 'path';

export class FileUtils {
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  static async writeFileWithDirectory(filePath: string, content: string): Promise<void> {
    const directory = path.dirname(filePath);
    await this.ensureDirectory(directory);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  static async readFileIfExists(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  static async listFilesRecursively(
    dirPath: string, 
    extensions: string[] = []
  ): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.listFilesRecursively(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    return files;
  }

  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  static normalizePathSeparators(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
}