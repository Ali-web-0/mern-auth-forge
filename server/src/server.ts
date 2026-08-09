import { createApp } from '@/app.js'
import { connectDB } from '@/lib/db.js'
import { env } from '@/lib/env.js'

async function main() {
  await connectDB()

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })
}

main().catch((error) => {
  console.error('Fatal startup error:', error)
  process.exit(1)
})
