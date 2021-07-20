import puppeteer from 'puppeteer';
import winston from '../config/winston';
import request_promise from 'request-promise';
import cheerio from 'cheerio';
import { URL_PROVINCES, LIST_PROVINCES, LIST_STORES } from '../config/WarehouseCrawlDataConfig';
import { normalizeText } from '../utils/string';

async function warehouseCrawlData() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    winston.info('Redirecting to page.on("request")');
    await page.on('request', (req) => {
      const typeImageVideo = ['image', 'media'];
      const videoExtension = ['.mp4', '.avi', '.flv', '.mov', '.wmv'];
      const pathImageVideo = req.url().toLowerCase();
      const resourceType = req.resourceType();
      const splitUrlByDot = pathImageVideo.split('.');
      // total '.' appear in a string
      const urlExtension = splitUrlByDot.length - 1;
      // show last string
      const videoTail = splitUrlByDot[urlExtension];
      if (videoExtension.includes(videoTail) === true || typeImageVideo.includes(resourceType) === true) {
        req.abort();
      } else {
        req.continue();
      }
    });

    winston.info(`Redirecting to [${URL_PROVINCES}]`);
    await page.goto(`${URL_PROVINCES}`, {
      waitUntil: 'load',
      timeout: 30000,
    });

    winston.info('Redirecting to page.content');
    await page.content();

    return await page.evaluate(() => {
      const domain = [];
      document.querySelectorAll('#contents > div.topArea > div.section.areas > div > div >.group').forEach((e) => {
        const city = [];
        e.querySelectorAll('ul > li').forEach((el) => {
          // @ts-ignore
          city.push(el.innerText);
        });
        domain.push({
          domain: e.querySelector('p').innerHTML,
          city,
        });
      });
      return domain;
    });
  } catch (error) {
    winston.info(error);
  }
}

async function detailPageWarehouse(url) {
  try {
    const options = {
      method: 'GET',
      uri: `${URL_PROVINCES}/${url}`,
    };
    winston.info(options.uri);
    const result = await request_promise(options);
    winston.info('result');
    const symbol = cheerio.load(result);
    const dataWarehouse = [];
    symbol(LIST_PROVINCES.DOM_ITEM_CITY).each(function () {
      const dataPageData = [];
      dataPageData.push({
        key: 'city',
        value: symbol(this).find(LIST_PROVINCES.DOM_CITY).text(),
      });
      symbol(this)
        .find(LIST_PROVINCES.DOM_OTHER_INFORMATION)
        .each(function () {
          dataPageData.push({
            key: symbol(this).find('th').text(),
            value: symbol(this).find('td').text(),
          });
        });
      dataWarehouse.push(dataPageData);
    });
    return dataWarehouse;
  } catch (error) {
    winston.info(error);
  }
}

async function detailPageProvince() {
  try {
    const dataPageWare = [];
    const options = {
      method: 'GET',
      uri: `${URL_PROVINCES}/tokyo`,
    };
    const result = await request_promise(options);
    winston.info('result');
    const symbol = cheerio.load(result);
    const dataWarehouse = [];
    symbol(LIST_PROVINCES.DOM_PROVINCE).each(function (e) {
      dataWarehouse.push(symbol(this).find(LIST_PROVINCES.DOM_WAREHOUSE).attr('href').substring(1));
    });
    winston.info('dataWarehouse');

    for (let i = 0; i < dataWarehouse.length; i++) {
      const start = Date.now();
      const optionsProvince = {
        method: 'GET',
        uri: `https://www.cbre-propertysearch.jp/${dataWarehouse[i]}`,
      };
      winston.info('optionsProvince');
      const resultProvince = await request_promise(optionsProvince);
      winston.info('resultProvince');
      const operator = cheerio.load(resultProvince);
      const dataPage = [];
      const dataImage = [];
      operator(LIST_STORES.DOM_IMAGE).each(function () {
        dataImage.push(operator(this).find('img').attr('data-src'));
      });
      // tslint:disable-next-line: prefer-for-of
      for (let t = 0; t < dataImage.length; t++) {
        dataPage.push({
          key: `image[${t}]`,
          value: dataImage[t],
        });
      }
      operator(LIST_STORES.DOM_TABLE).each(function () {
        dataPage.push({
          key: normalizeText(operator(this).find('th').text()),
          value: operator(this).find('td').text(),
        });
      });
      dataPageWare.push(dataPage);
      const dateTimeRequest = (Date.now() - start) / 1000;
      winston.info({
        Request: i + 1,
        'Request time': dateTimeRequest,
      });
      winston.info('dataPageWare');
    }
    return dataPageWare;
  } catch (error) {
    winston.info(error);
  }
}

export { warehouseCrawlData, detailPageWarehouse, detailPageProvince };
