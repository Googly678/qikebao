// Configuration used for partner integration and mock server
// During local development, point API_BASE to the mock server on port 3001 so
// frontend calls to /api/* are handled by server.js. In production this can
// be set to a relative path or a real backend via environment variables.
export const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

// Partner landing route within this app (simulates 我方平台签约落地页)
export const PARTNER_LANDING_PATH = '/partner/landing'

// Channel id used when assembling redirect parameters
export const DEFAULT_CHANNEL_ID = 'channel-rc-001'
