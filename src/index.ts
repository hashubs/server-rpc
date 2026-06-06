import { Hono } from 'hono';
import { wallet } from './routes/wallet';
import { proxy } from './routes/proxy';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/wallet', wallet);
app.route('/api/proxy', proxy);

export default app;
