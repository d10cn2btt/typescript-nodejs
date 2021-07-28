import winston from '../config/winston';
import request_promise from 'request-promise';
import cheerio from 'cheerio';
import { URL_HOME_PAGE, URL_PROVINCES, LIST_PROVINCES, LIST_WARE_HOUSE, LIST_DETAILS_WARE_HOUSE } from '../config/WarehouseCrawlDataConfig';
import { normalizeText } from '../utils/string';
import fs from 'fs';
import { readFile } from 'fs/promises';

async function crawlLinkProvinces() {
  try {
    const options = {
      method: 'GET',
      uri: `${URL_PROVINCES}`,
    };
    const result = await request_promise(options);
    const operator = cheerio.load(result);
    const dataWarehouse = [];
    operator(LIST_PROVINCES.DOM_LAYOUT_PROVINCE).each(function () {
      operator(this)
        .find(LIST_PROVINCES.DOM_URL_PROVINCE)
        .each(function () {
          const dataHref = operator(this).find('a').attr('href');
          if (dataHref) {
            dataWarehouse.push({
              pathWareHouse: `${URL_HOME_PAGE}${dataHref}`,
            });
          }
        });
    });
    winston.info('[crawl success data url provinces]');
    return dataWarehouse;
  } catch (err) {
    winston.info(err);
  }
}

async function crawlPathWareHouse() {
  const dataCrawlPathWareHouse = [];
  const linksCity = await crawlLinkProvinces();
  for (const i of linksCity) {
    try {
      const options = {
        method: 'GET',
        uri: i.pathWareHouse,
      };
      const result = await request_promise(options);
      const operator = cheerio.load(result);
      const totalPaging = operator(LIST_WARE_HOUSE.DOM_TOTAL_PAGING).text();
      let countPaging = 1;
      if (totalPaging === '') {
        countPaging = 1;
      } else {
        countPaging = Number(totalPaging);
      }
      winston.info(countPaging);

      for (let k = 0; k < countPaging; k++) {
        const optionsPaging = {
          method: 'GET',
          uri: `${options.uri}?page=${k + 1}`,
        };
        winston.info(optionsPaging.uri);
        const resultPaging = await request_promise(optionsPaging);
        const operatorPaging = cheerio.load(resultPaging);
        operatorPaging(LIST_WARE_HOUSE.DOM_URL_WARE_HOUSE_).each(function () {
          dataCrawlPathWareHouse.push({
            url: `${URL_HOME_PAGE}${operatorPaging(this).find('a').attr('href')}`,
            status: 0,
          });
        });
        fs.writeFile('pathDetailsWareHouse.json', JSON.stringify(dataCrawlPathWareHouse), (err) => {
          if (err) throw err;
          winston.info(`save url ${optionsPaging.uri} done !`);
        });
      }
    } catch (error) {
      winston.info(error);
    }
  }
  winston.info('[crawl success data url ware house]');
  return dataCrawlPathWareHouse;
}

async function detailPageWarehouse() {
  try {
    // Check if the file exists or not
    const filePathDetailsWareHouse = 'pathDetailsWareHouse.json';
    if (!fs.existsSync(filePathDetailsWareHouse)) {
      // Create file;
      fs.writeFile('pathDetailsWareHouse.json', '', (err) => {
        if (err) throw err;
      });
    }

    // Read file json
    let dataPathWareHouse: any = await readFile('pathDetailsWareHouse.json', 'utf8');

    // Check if the json file has data, if it is not possible to crawl data first.
    if (Object.keys(dataPathWareHouse).length === 0 || dataPathWareHouse.constructor === Object) {
      dataPathWareHouse = await crawlPathWareHouse();
    } else {
      dataPathWareHouse = JSON.parse(dataPathWareHouse);
    }

    // Check file json, if status = 0 => crawl data warehouse details with status = 0 -> save data 1 file and change status = 0->1
    // Check if the file exists or not
    const pathDetailsWareHouse = 'data.json';
    if (!fs.existsSync(pathDetailsWareHouse)) {
      // Create file;
      fs.writeFile('data.json', '', (err) => {
        if (err) throw err;
      });
    }

    // read file data.json . If data file fileJson = data file data.json, else fileJson = []
    let dataOutput = [];
    const dataTest = await readFile('data.json', 'utf8');
    if (Object.keys(dataTest).length === 0 || dataTest.constructor === Object) {
      dataOutput = [];
    } else {
      dataOutput = JSON.parse(dataTest);
    }

    for (const dataPath of dataPathWareHouse) {
      const start = Date.now();
      const dataPage = [];
      if (dataPath.status === 0) {
        const optionsProvince = {
          method: 'GET',
          uri: dataPath.url,
        };
        const resultProvince = await request_promise(optionsProvince);
        const operator = cheerio.load(resultProvince);
        const dataImage = [];
        operator(LIST_DETAILS_WARE_HOUSE.DOM_IMAGE).each(function () {
          dataImage.push(operator(this).find('img').attr('data-src'));
        });
        for (let t = 0; t < dataImage.length; t++) {
          if (dataImage[t]) {
            dataPage.push({
              key: `image[${t}]`,
              value: dataImage[t],
            });
          }
        }

        operator(LIST_DETAILS_WARE_HOUSE.DOM_TABLE).each(function () {
          dataPage.push({
            key: normalizeText(operator(this).find('th').text()),
            value: normalizeText(operator(this).find('td').text()),
          });
        });
        dataPath.status = 1;
        winston.info(dataPage);
        dataOutput.push(dataPage);

        fs.writeFile('data.json', JSON.stringify(dataOutput), (err) => {
          if (err) throw err;
          winston.info('save data detail ware house done !');
        });
        fs.writeFile('pathDetailsWareHouse.json', JSON.stringify(dataPathWareHouse), (err) => {
          if (err) throw err;
          winston.info('update status = 1 done !');
        });
        const dateTimeRequest = (Date.now() - start) / 1000;
        winston.info({
          'Request time': dateTimeRequest,
        });
        winston.info('dataPageWare');
      }
    }
    winston.info('[crawl success data details ware house]');
    return dataOutput;
  } catch (error) {
    winston.info(error);
  }
}

export { crawlLinkProvinces, crawlPathWareHouse, detailPageWarehouse };
