import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { testConnection } from './config/database';
import { errorMiddleware } from './middlewares/error-middleware';
import routes from './routes';

const app: Application = express();

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Rotas da API
app.use('/api/v1', routes);

// Rota 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Rota não encontrada' },
  });
});

// Middleware de erro (deve ser o último)
app.use(errorMiddleware);

// Iniciar servidor
const PORT = parseInt(env.PORT, 10);

const startServer = async () => {
  // Testar conexão com Supabase
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('❌ Não foi possível conectar ao Supabase. Verifique as credenciais.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📝 Ambiente: ${env.NODE_ENV}`);
  });
};

startServer();

export default app;