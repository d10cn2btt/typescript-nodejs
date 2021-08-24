import express, { Router } from 'express';

import CrawlController from '../controllers/CrawlDemo';
import WarehouseController from '../controllers/WarehouseCrawlData';
import CrawlPageProvinceController from '../controllers/CrawlPageProvince';
// import rateLimit from 'express-rate-limit';

const router = Router();
// const limiter = rateLimit({
//   max: 1,
// });

router.get('/capture-screen', CrawlController.captureScreen);
router.get('/crawl-list-page', CrawlController.crawlListPage);

// warehouse crawl data
router.get('/warehouse-crawl-data', WarehouseController.warehouse);
router.get('/warehouse-detail-page/:url', WarehouseController.detailWarehouse);
router.get('/warehouse-crawl-detail-page-province', WarehouseController.detailProvince);

// crawl page province
router.get('/crawl-detail-page-province', CrawlPageProvinceController.detailWarehouses);
router.delete('/remove-folder-logs', CrawlPageProvinceController.removeFolder);
router.get('/reset-folder-logs', CrawlPageProvinceController.resetFolder);

export default router;
