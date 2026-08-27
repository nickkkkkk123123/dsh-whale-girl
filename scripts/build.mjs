import { execSync } from 'node:child_process'
import fs from 'node:fs'

fs.rmSync('lib', { recursive: true, force: true })
execSync('npx tsdown', { stdio: 'inherit', shell: process.platform === 'win32' })
