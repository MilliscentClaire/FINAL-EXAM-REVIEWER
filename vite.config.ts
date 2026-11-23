import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function courseFilesPlugin(): Plugin {
  const baseDir = path.resolve(process.cwd(), 'docs', 'reviewer files')

  return {
    name: 'serve-course-files',
    configureServer(server) {
      server.middlewares.use('/course-files', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next()
          return
        }

        const rawUrl = (req.url ?? '/').split('?')[0]
        let decodedPath: string
        try {
          decodedPath = decodeURIComponent(rawUrl).replace(/^\/+/, '')
        } catch {
          res.statusCode = 400
          res.end('Bad request')
          return
        }

        const resolved = path.resolve(baseDir, decodedPath)
        const relative = path.relative(baseDir, resolved)
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
          res.statusCode = 404
          res.end('File not found')
          return
        }

        const ext = path.extname(resolved).toLowerCase()
        if (ext === '.pdf') {
          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Content-Disposition', 'inline')
        } else if (ext === '.docx') {
          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          )
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${path.basename(resolved)}"`,
          )
        }

        if (req.method === 'HEAD') {
          res.end()
          return
        }

        fs.createReadStream(resolved).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), courseFilesPlugin()],
})
