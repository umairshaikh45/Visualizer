import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { analyzeRepository } from './src/services/repoAnalyzer.js';


export default defineConfig({
  plugins: [
    reactPlugin(),
    {
      name: 'analyze-api',
      configureServer(server) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url === '/api/analyze' && req.method === 'POST') {
            const chunks: Buffer[] = [];
            
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            
            req.on('end', async () => {
              try {
                const data = JSON.parse(Buffer.concat(chunks).toString());
                const { repoUrl } = data;
                
                if (!repoUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Repository URL is required' }));
                  return;
                }
                
                console.log('Received analysis request for:', repoUrl);
                const result = await analyzeRepository(repoUrl);
                console.log('Analysis complete:', {
                  nodes: result.nodes.length,
                  edges: result.edges.length
                });
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (error) {
                console.error('Analysis error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  error: error instanceof Error ? error.message : 'An unexpected error occurred' 
                }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173
  }
});
