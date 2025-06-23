// Do NOT remove or move this appdynamics require, it must be on the first line, or else it will not work
require('appdynamics').profile({
  controllerHostName: process.env.APP_DYNAMICS_HOST,
  controllerPort: 443,
  controllerSslEnabled: true,
  accountName: process.env.APP_DYNAMICS_ACCOUNT_NAME,
  accountAccessKey: process.env.APP_DYNAMICS_KEY,
  applicationName: 'Backend-user-app',
  tierName: 'Analytics-tier',
  nodeName: 'Analytics-node'
});
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './utils/errors/error-handler.middleware';
import cors from "cors";
import analyticsRoutes from './features/analytics/routes/analytics.routes';

export const app = express();
const PORT = 3005;

app.get('/', (req, res) => {
    res.send('Server is running on port 3005');
});
app.use(express.json());
app.use(cors());

// Add the user posts routes
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware should be last
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});