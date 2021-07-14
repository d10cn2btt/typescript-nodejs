import puppeteer from 'puppeteer';
import winston from '../config/winston';
import request_promise from 'request-promise';
import cheerio from 'cheerio';
import { URL, LIST_PROVINCE, LIST_STORE } from '../config/WarehouseCrawlDataConfig';
import { normalizeText } from './Helper';

async function warehouseCrawlData() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    winston.info('Redirecting to page.on(\'request\')');
    await page.on('request', (req) => {
      const typeImageVideo = ['image', 'media'];
      const videoExtension = ['.mp4', '.avi', '.flv', '.mov', '.wmv'];
      const url = req.url().toLowerCase();
      const resourceType = req.resourceType();
      const splitUrlByDot = url.split('.');
      // total '.' appear in a string
      const urlExtension = splitUrlByDot.length - 1;
      // show last string
      const videoTail = splitUrlByDot[urlExtension];
      if (
        videoExtension.includes(videoTail) === true ||
        typeImageVideo.includes(resourceType) === true
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    winston.info(`Redirecting to [${URL}]`);
    await page.goto(`${URL}`, {
      waitUntil: 'load',
      timeout: 30000,
    });

    winston.info('Redirecting to page.content');
    await page.content();

    return await page.evaluate(() => {
      const domain = [];
      document
        .querySelectorAll(
          '#contents > div.topArea > div.section.areas > div > div >.group'
        )
        .forEach((e) => {
          const City = [];
          e.querySelectorAll('ul>li').forEach((el) => {
            // @ts-ignore
            City.push(el.innerText);
          });
          domain.push({
            Domain: e.querySelector('p').innerHTML,
            City,
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
      uri: `${URL}${url}`,
    };
    const result = await request_promise(options);
    winston.info('result');
    const symbol = cheerio.load(result);
    const dataWarehouse = [];
    symbol(LIST_PROVINCE.DOM_PROVINCE).each(function (e) {
      dataWarehouse.push({
        Name: symbol(this).find(LIST_PROVINCE.DOM_WAREHOUSE).text(),
        Location: symbol(this).find(LIST_PROVINCE.DOM_LOCATION).text(),
        Traffic: symbol(this).find(LIST_PROVINCE.DOM_TRAFFIC).text(),
        Scale: symbol(this).find(LIST_PROVINCE.DOM_SCALE).text(),
        Completion: symbol(this).find(LIST_PROVINCE.DOM_COMPLETION).text(),
      });
    });

    return dataWarehouse;
  } catch (error) {
    winston.info(error);
  }
}

async function detailPageProvincial() {
  try {
    const dataPageWare = [];
    const options = {
      method: 'GET',
      uri: `${URL}tokyo/`,
    };
    const result = await request_promise(options);
    winston.info('result');
    const symbol = cheerio.load(result);
    const dataWarehouse = [];
    symbol(LIST_PROVINCE.DOM_PROVINCE).each(function (e) {
      dataWarehouse.push(
        symbol(this).find(LIST_PROVINCE.DOM_WAREHOUSE).attr('href'),
      );
    });
    winston.info('dataWarehouse');

    for(let i = 0; i < dataWarehouse.length; i++) {
      const start = Date.now();
      const optionsTokyo = {
        method: 'GET',
        uri: `https://www.cbre-propertysearch.jp${dataWarehouse[i]}`,
      };
      winston.info('optionsTokyo');
      const resultTokyo = await request_promise(optionsTokyo);
      winston.info('resultTokyo');
      const operator = cheerio.load(resultTokyo);
      let dataPage = {};
      const dataImage = [];
      operator(LIST_STORE.DOM_IMAGE).each(function(){
        dataImage.push(operator(this).find('img').attr('data-src'));
      });
      dataPage = Object.assign({}, dataImage);
      operator(LIST_STORE.DOM_TABLE).each(function(){
        dataPage[normalizeText(operator(this).find('th').text())]= normalizeText(operator(this).find('td').text());
      });
      // winston.info(data);
      dataPageWare.push(dataPage);
      const dateTimeRequest = (Date.now() - start)/1000;
        winston.info({
          'Request' : i + 1,
          'Request time': dateTimeRequest,
      });

      winston.info('dataPageWare');
    }
    return dataPageWare;
  } catch (error) {
    winston.info(error);
  }
}

export { warehouseCrawlData, detailPageWarehouse, detailPageProvincial };