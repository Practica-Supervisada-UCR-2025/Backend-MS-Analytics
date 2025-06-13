import { RequestHandler, Router } from 'express';
import { UserAnalyticsController } from '../controllers/user-analytics.controller';
import { ReportAnalyticsController } from '../controllers/report-analytics.controller';
import { authenticateJWT } from '../../middleware/authenticate.middleware';
import { getReportedPostsController } from '../controllers/reported.posts.controller';

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

router.get(
  '/posts-stats/reported',
  authenticateJWT,
  getReportedPostsController as RequestHandler
);

export default router;