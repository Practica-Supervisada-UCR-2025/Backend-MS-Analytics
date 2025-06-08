import { Router } from 'express';
import { UserAnalyticsController } from '../controllers/user-analytics.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';

const router = Router();
const userAnalyticsController = new UserAnalyticsController();

// Route for user growth statistics
router.get(
  '/users-stats/growth',
  authenticateJWT,
  userAnalyticsController.getUserGrowthStats.bind(userAnalyticsController)
);

export default router;