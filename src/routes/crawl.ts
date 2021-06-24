import { Router } from 'express';

import CrawlController from '../controllers/CrawlDemo';
import TimeSheet from '../controllers/CrawlTimeSheet';

const router = Router();

router.get('/capture-screen', CrawlController.captureScreen);
router.get('/crawl-list-page', CrawlController.crawlListPage);
router.get('/time-sheet', TimeSheet.timeSheet);

export default router;
