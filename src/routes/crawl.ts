import { Router } from 'express';

import CrawlController from '../controllers/CrawlDemo';
import WarehouseController from '../controllers/WarehouseCrawlData';

const router = Router();

router.get('/capture-screen', CrawlController.captureScreen);
router.get('/crawl-list-page', CrawlController.crawlListPage);

// warehouse crawl data
router.get('/warehouse-crawl-data', WarehouseController.warehouse);
router.get('/warehouse-detail-page/:url', WarehouseController.detailWarehouse);
router.get('/warehouse-crawl-detail-page-province', WarehouseController.detailProvince);

export default router;
