import { Router, RequestHandler} from 'express';
import { UserAnalyticsController } from '../controllers/user-analytics.controller';
import { ReportAnalyticsController } from '../controllers/report-analytics.controller';
import { getTotalPostsStatsController } from '../controllers/postStats.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';

const router = Router();
const userAnalyticsController = new UserAnalyticsController();
const reportAnalyticsController = new ReportAnalyticsController();


// Route for user growth statistics
router.get(
  '/users-stats/growth',
  authenticateJWT,
  userAnalyticsController.getUserGrowthStats.bind(userAnalyticsController)
);

router.get(
  '/posts-stats/volume',
  authenticateJWT,
  reportAnalyticsController.getReportVolumeStats.bind(reportAnalyticsController)
);

// Get total posts stats grouped by period (protected by JWT)
router.get('/posts/stats/total', authenticateJWT, getTotalPostsStatsController as RequestHandler);


export default router;