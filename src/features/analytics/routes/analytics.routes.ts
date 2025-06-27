import { RequestHandler, Router} from 'express';
import { UserAnalyticsController } from '../controllers/user-analytics.controller';
import { ReportAnalyticsController } from '../controllers/report-analytics.controller';
import { getTotalPostsStatsController } from '../controllers/postStats.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { getReportedPostsController } from '../controllers/reported.posts.controller';
import { getTopInteractedPostsController } from '../controllers/posts.controller';

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

router.get(
  '/users-stats/growth/non-cumulative',
  authenticateJWT,
  userAnalyticsController.getUserGrowthStatsNonCumulative.bind(userAnalyticsController)
);

router.get(
  '/posts-stats/reported',
  authenticateJWT,
  getReportedPostsController as RequestHandler
);
// http://localhost:3005/api/analytics/posts-stats/reported?interval=weekly&startDate=2025-05-11&endDate=2025-06-20

router.get(
  '/posts-stats/top-interacted', 
  authenticateJWT,
  getTopInteractedPostsController as RequestHandler
);
// http://localhost:3005/api/analytics/posts-stats/top-interacted?interval=weekly&startDate=2025-05-11&endDate=2025-06-20&limit=4

export default router;