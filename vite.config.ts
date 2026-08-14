import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const repoName = env.GITHUB_REPOSITORY?.split('/')[1]
  const isGitHubActions = env.GITHUB_ACTIONS === 'true'

  return {
    base: isGitHubActions && repoName ? `/${repoName}/` : '/',
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
  }
})
