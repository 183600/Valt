#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

// 检查并安装依赖
function ensureDependencies() {
  const currentDir = process.cwd();
  const nodeModulesDir = join(currentDir, 'node_modules');
  
  if (!existsSync(nodeModulesDir)) {
    console.log('Dependencies not found. Installing in packages/query...');
    
    return new Promise((resolve, reject) => {
      const install = spawn('pnpm', ['install'], { 
        stdio: 'inherit',
        shell: true,
        cwd: currentDir
      });
      
      install.on('error', (error) => {
        console.error('Error: Failed to install dependencies.');
        console.error('Please ensure pnpm is installed and run "pnpm install" manually.');
        reject(error);
      });
      
      install.on('exit', (code) => {
        if (code === 0) {
          console.log('Dependencies installed successfully.');
          resolve();
        } else {
          console.error(`Dependency installation failed with exit code ${code}.`);
          reject(new Error(`Install failed with code ${code}`));
        }
      });
    });
  }
  return Promise.resolve();
}

// 运行测试
function runTests() {
  console.log('Running tests with npx vitest...');
  
  // 使用 npx 运行 vitest
  const vitest = spawn('npx', ['vitest', ...process.argv.slice(2)], { 
    stdio: 'inherit',
    shell: true 
  });
  
  vitest.on('error', (error) => {
    console.error('Error: Failed to start vitest. Make sure dependencies are installed.');
    console.error('Please run "pnpm install" in the repository root.');
    process.exit(1);
  });
  
  vitest.on('exit', (code) => {
    process.exit(code);
  });
}

// 先确保依赖存在，然后运行测试
ensureDependencies()
  .then(() => {
    runTests();
  })
  .catch((error) => {
    console.error('Failed to ensure dependencies:', error.message);
    process.exit(1);
  });