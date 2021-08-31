import { crawlDetailWarehouses, removeFolderLogs, readDataFileIfExists, createFolderIfNotExists, getCrawlInfo, getResponseWhileCrawling, createFolderLogs } from '../services/CrawlPageProvince';
import { FOLDER_FILE_DATA, FILE_STATUS_CRAWL, FILE_URL_WAREHOUSE, FILE_TIME, FILE_PROVINCES, FOLDER_DEBUG, FILE_STATISTICAL } from '../config/ConstFileJson';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import moment from 'moment';

let statusCrawl = 'DONE';
export default class CrawlPageProvinceController {
  public static async detailWarehouses(req, res, next): Promise<any> {
    try {
      await createFolderIfNotExists(`${FOLDER_FILE_DATA}`);
      if (!fs.existsSync(`${FOLDER_FILE_DATA}/${FILE_TIME}`)) {
        const startTime = moment().format('YYYY/MM/DD, HH:mm:ss');
        await writeFile(`${FOLDER_FILE_DATA}/${FILE_TIME}`, startTime);
      }
      let dateTime = '';
      // Check if there is data, if not, then go with OFF
      if (!fs.existsSync(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`)) {
        await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`, statusCrawl);
      }
      // Read file
      const fileStatusCrawl: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`);
      dateTime = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_TIME}`);
      if (fileStatusCrawl === 'ON') {
        const response = await getResponseWhileCrawling(dateTime, 'Crawling is in progress. Please wait until it is completed');
        return res.json(response);
      } else if (fileStatusCrawl === 'OFF') {
        if (!fs.existsSync(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_PROVINCES}`)) {
          const startTime = moment().format('YYYY/MM/DD, HH:mm:ss');
          await writeFile(`${FOLDER_FILE_DATA}/${FILE_TIME}`, startTime);
        }
        dateTime = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_TIME}`);
        statusCrawl = 'ON';
        await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`, statusCrawl);
        crawlDetailWarehouses();

        return res.json({
          message: `Started crawling`,
          start_time: `${dateTime}`,
        });
      } else if (fileStatusCrawl === 'DONE') {
        let result: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_STATISTICAL}`);
        result = JSON.parse(result);

        return res.json({
          message: 'Crawling has been completed. Please run the create folder command before continuing to crawl',
          start_time: `${dateTime}`,
          total: result.totalUrl,
          crawled: result.crawledUrl,
          remain: result.remain,
          progress: result.progress + '%',
        });
      }
    } catch (error) {
      return res.json({
        message: error,
      });
    }
  }

  public static async removeFolder(req, res, next): Promise<any> {
    try {
      const dataFileStatusCrawl: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`);
      if (dataFileStatusCrawl !== 'DONE') {
        const dateTime = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_TIME}`);
        const response = await getResponseWhileCrawling(dateTime, 'Crawling is in progress. Please wait until it is completed');

        return res.json(response);
      } else {
        await removeFolderLogs();
        statusCrawl = 'OFF';
        await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`, statusCrawl);

        return res.json({
          message: 'Successfully deleted',
        });
      }
    } catch (err) {
      return res.json({
        message: 'Has a error, please check back data file',
      });
    }
  }

  public static async resetFolder(req, res, next): Promise<any> {
    try {
      const dataFileStatusCrawl: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`);
      if (dataFileStatusCrawl === 'DONE') {
        await createFolderLogs();
        statusCrawl = 'OFF';
        await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`, statusCrawl);

        return res.json({
          message: 'Successfully created',
        });
      } else {
        const dateTime = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FILE_TIME}`);
        const response = await getResponseWhileCrawling(dateTime, 'Not create folder');

        return res.json(response);
      }
    } catch (error) {
      return res.json({
        message: error.message,
      });
    }
  }
}
