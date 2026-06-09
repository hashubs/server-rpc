import { Hono } from 'hono';
import { wallet } from './routes/wallet';
import { proxy } from './routes/proxy';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.use('/api/*', authMiddleware);

app.route('/api/wallet', wallet);
app.route('/api/proxy', proxy);

export default app;
