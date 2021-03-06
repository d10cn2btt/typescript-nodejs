import winston from '../config/winston';
import request_promise from 'request-promise';
import cheerio from 'cheerio';
import { URL_HOME_PAGE, URL_PROVINCES, LIST_PROVINCES, LIST_WAREHOUSES, DETAILS_WAREHOUSE } from '../config/WarehouseCrawlDataConfig';
import { FOLDER_FILE_DATA, FILE_PROVINCES, FILE_URL_PROVINCES, FILE_URL_WAREHOUSE, FILE_DATA_WAREHOUSE, TIMEOUT_BETWEEN_REQUEST, FILE_STATUS_CRAWL, FOLDER_DEBUG, FILE_TIME, FILE_STATISTICAL } from '../config/ConstFileJson';
import { normalizeText } from '../utils/string';
import fs from 'fs';
import fsPromises, { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { TRANSLATE_FROM_JAPANESE_TO_ENGLISH } from '../config/Translate';

async function crawlUrlProvinces() {
  try {
    const optionsRequest = {
      method: 'GET',
      uri: `${URL_PROVINCES}`,
    };
    const result = await request_promise(optionsRequest);
    const operator = cheerio.load(result);
    const urlProvinces = [];
    operator(LIST_PROVINCES.DOM_LAYOUT_PROVINCES).each(function () {
      operator(this)
        .find(LIST_PROVINCES.DOM_URL_PROVINCES)
        .each(function () {
          const dataHref = operator(this).find('a').attr('href');
          if (dataHref) {
            urlProvinces.push({
              url: `${URL_HOME_PAGE}${dataHref}`,
              status: 0,
            });
          }
        });
    });
    await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_PROVINCES}`, JSON.stringify(urlProvinces));
    winston.info('[Crawl success data url provinces]');

    return urlProvinces;
  } catch (err) {
    winston.info(err);
  }
}

async function saveUrlProvinces() {
  try {
    let urlProvinces = [];
    await createFileIfNotExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_PROVINCES}`);
    const provinces = await getDataFileNotTimeOut(`${FILE_PROVINCES}`, crawlUrlProvinces);
    const dataFileUrlProvince = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_PROVINCES}`);
    if (Object.keys(dataFileUrlProvince).length !== 0 && dataFileUrlProvince.constructor !== Object) {
      urlProvinces = JSON.parse(dataFileUrlProvince);
    }

    for (const province of provinces) {
      try {
        if (province.status !== 0) {
          continue;
        }
        const totalPage = await totalPages(province.url);
        for (let k = 0; k < totalPage; k++) {
          const optionsPaging = {
            method: 'GET',
            uri: `${province.url}?page=${k + 1}`,
          };
          urlProvinces.push({
            url: optionsPaging.uri,
            status: 0,
          });
          province.status = 1;

          await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_PROVINCES}`, JSON.stringify(urlProvinces));
          winston.info(`Save url ${optionsPaging.uri} done !`);

          await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_PROVINCES}`, JSON.stringify(provinces));
        }
      } catch (error) {
        winston.info(error);
      }
    }
    winston.info('[Crawl success url province]');

    return urlProvinces;
  } catch (error) {
    winston.error(error);
  }
}

async function crawlUrlWareHouses() {
  try {
    winston.info('[start crawl url warehouse]');
    let urlWarehouse = [];
    await createFileIfNotExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_PROVINCES}`);
    const urlProvinces = await getDataFileTimeOut(`${FILE_URL_PROVINCES}`, saveUrlProvinces, FILE_PROVINCES);
    const dataFileUrlWarehouse = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_WAREHOUSE}`);

    if (Object.keys(dataFileUrlWarehouse).length !== 0 && dataFileUrlWarehouse.constructor !== Object) {
      urlWarehouse = JSON.parse(dataFileUrlWarehouse);
    }

    for (const province of urlProvinces) {
      if (province.status !== 0) {
        continue;
      }

      const optionsPaging = {
        method: 'GET',
        uri: `${province.url}`,
      };
      const resultPaging = await request_promise(optionsPaging);
      const operatorPaging = cheerio.load(resultPaging);
      operatorPaging(LIST_WAREHOUSES.DOM_URL_WAREHOUSES).each(function () {
        urlWarehouse.push({
          url: `${URL_HOME_PAGE}${operatorPaging(this).find('a').attr('href')}`,
          status: 0,
        });
      });
      province.status = 1;

      await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_WAREHOUSE}`, JSON.stringify(urlWarehouse));
      winston.info(`Save url warehouse: ${optionsPaging.uri} done !`);

      await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_PROVINCES}`, JSON.stringify(urlProvinces));
    }

    return urlWarehouse;
  } catch (error) {
    winston.info(error);
  }
}

async function crawlDetailWarehouses() {
  try {
    winston.info('[Start crawl detail warehouse]');
    await createFileIfNotExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_DATA_WAREHOUSE}`);

    // read file dataWarehouse.json . If data file dataWarehouse = data file output.json, else dataWarehouse = []
    const dataFileWarehouse = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_DATA_WAREHOUSE}`);
    let dataWarehouse = [];
    if (Object.keys(dataFileWarehouse).length !== 0 && dataFileWarehouse.constructor !== Object) {
      dataWarehouse = JSON.parse(dataFileWarehouse);
    }

    await createFileIfNotExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_WAREHOUSE}`);
    const dataUrlWareHouses = await getDataFileTimeOut(`${FILE_URL_WAREHOUSE}`, crawlUrlWareHouses, FILE_URL_PROVINCES);

    for (const dataUrl of dataUrlWareHouses) {
      const timeStartCrawl = Date.now();
      const warehouse = [];

      if (dataUrl.status !== 0) {
        continue;
      }

      const optionsWarehouse = {
        method: 'GET',
        uri: dataUrl.url,
        simple: false,
        resolveWithFullResponse: true,
      };
      const resultProvince = await request_promise(optionsWarehouse);
      if (resultProvince.statusCode !== 200) {
        dataUrl.status = -1;
        continue;
      }
      const operator = cheerio.load(resultProvince.body);
      operator(DETAILS_WAREHOUSE.DOM_IMAGES).each(function () {
        const image = operator(this).find('img').attr('data-src');
        if (image) {
          warehouse.push({
            value: image,
          });
        }
      });
      operator(DETAILS_WAREHOUSE.DOM_TABLES).each(function () {
        warehouse.push({
          key: normalizeText(operator(this).find('th').text()),
          value: normalizeText(operator(this).find('td').text()),
        });
      });

      // sourcePath
      const sourcePath = {
        key: '???????????????',
        value: dataUrl.url,
      };
      warehouse.push(sourcePath);

      // warehouseEquipment
      const warehouseEquipment = [];
      operator('#contents > div > div.columnSection.clearfix > div > div.bodySection > ul.icons > li').each(function () {
        warehouseEquipment.push(normalizeText(operator(this).text()));
      });
      warehouse.push({
        key: '????????????',
        value: warehouseEquipment,
      });
      dataUrl.status = 1;

      // TranslateFromJapaneseToEnglish
      const dataTranslate = warehouse.filter((data) => {
        for (const translate of TRANSLATE_FROM_JAPANESE_TO_ENGLISH) {
          if (data.key === translate.key) {
            data.key = translate.value;
            return data;
          }
        }
      });

      const customer: any = {};
      for (const data of dataTranslate) {
        const key = data.key;
        const value = data.value;
        customer[key] = value;
      }

      // Format area field
      if (customer.area) {
        let finalArea = customer.area;
        finalArea = finalArea.split(' / ')[1];
        finalArea = finalArea.substring(0, finalArea.length - 2);
        finalArea = finalArea.replace(',', '');
        customer.area = +finalArea;
      }

      const defaultWarehouseInfo = {};
      for (const field of TRANSLATE_FROM_JAPANESE_TO_ENGLISH) {
        defaultWarehouseInfo[field.value] = field.default_value;
      }

      const warehouseInfo = { ...defaultWarehouseInfo, ...customer };
      dataWarehouse.push(warehouseInfo);

      await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_DATA_WAREHOUSE}`, JSON.stringify(dataWarehouse));
      await writeFile(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_WAREHOUSE}`, JSON.stringify(dataUrlWareHouses));
      await waitingTime();
      const dateTimeRequest = (Date.now() - timeStartCrawl) / 1000;
      winston.info(`Crawl url ${dataUrl.url} done!. Time request: ${dateTimeRequest}s`);
    }

    const crawlInfo = await getCrawlInfo();
    await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATISTICAL}`, JSON.stringify(crawlInfo));

    const currentDate = new Date();
    await fsPromises.rename(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}`, `${FOLDER_FILE_DATA}/Warehouse_${currentDate.getFullYear()}${currentDate.getMonth() + 1}${currentDate.getDate()}_${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`);
    // Check if the file has been crawled or not, if crawled, statusCrawl = 'DONE';
    await writeFile(`${FOLDER_FILE_DATA}/${FILE_STATUS_CRAWL}`, 'DONE');
    winston.info('[Crawl success data details ware house]');

    return [dataWarehouse];
  } catch (error) {
    winston.info(error);
  }
}

async function removeFolderLogs() {
  await removeFileIfExists(`${FOLDER_FILE_DATA}/${FILE_PROVINCES}`);
  await removeFileIfExists(`${FOLDER_FILE_DATA}/${FILE_URL_PROVINCES}`);
  await removeFileIfExists(`${FOLDER_FILE_DATA}/${FILE_URL_WAREHOUSE}`);
  await removeFileIfExists(`${FOLDER_FILE_DATA}/${FILE_DATA_WAREHOUSE}`);
}

async function createFolderLogs() {
  await createFolderIfNotExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}`);
}

async function totalPages(url) {
  const options = {
    method: 'GET',
    uri: url,
  };
  const result = await request_promise(options);
  const operator = cheerio.load(result);
  const pages = operator(LIST_WAREHOUSES.DOM_TOTAL_PAGING).text();

  return pages === '' ? 1 : Number(pages);
}

async function createFolderIfNotExists(folder) {
  if (!fs.existsSync(folder)) {
    await mkdir(folder);
  }
}

async function removeFileIfExists(path) {
  if (fs.existsSync(path)) {
    return await unlink(path);
  }
}

async function createFileIfNotExists(path) {
  // Check if the file exists or not
  if (!fs.existsSync(path)) {
    await writeFile(path, '');
  }
}

async function readDataFileIfExists(path) {
  if (fs.existsSync(path)) {
    return readFile(path, 'utf-8');
  }

  return null;
}

async function getCrawlInfo() {
  const pathFileUrlWarehouse = `${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${FILE_URL_WAREHOUSE}`;
  let urlWarehouses: any = await readDataFileIfExists(pathFileUrlWarehouse);
  if (!urlWarehouses) {
    return null;
  }

  urlWarehouses = JSON.parse(urlWarehouses);
  const totalUrl: number = urlWarehouses.length;
  const crawledUrl: number = urlWarehouses.filter((url) => url.status === 1).length;
  const remainUrl: number = totalUrl - crawledUrl;
  const progress: number = +((crawledUrl * 100) / totalUrl).toFixed(2);

  return {
    totalUrl,
    crawledUrl,
    remainUrl,
    progress,
  };
}

async function getResponseWhileCrawling(dateTime, message) {
  let response = {};
  const crawlInfo = await getCrawlInfo();
  if (!crawlInfo) {
    response = {
      message,
    };
  } else {
    response = {
      message,
      start_time: `${dateTime}`,
      total: crawlInfo.totalUrl,
      crawled: crawlInfo.crawledUrl,
      remain: crawlInfo.remainUrl,
      progress: crawlInfo.progress + '%',
    };
  }

  return response;
}

async function getDataFileNotTimeOut(path, functionPass) {
  // Read file json
  let dataFile: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${path}`);
  // Check if the json file urlDetailsWareHouse.json has data, if file no data -> get data in function crawlUrlWareHouse()
  if (Object.keys(dataFile).length === 0 || dataFile.constructor === Object) {
    dataFile = await functionPass();
  } else {
    dataFile = JSON.parse(dataFile);
  }

  return dataFile;
}

async function getDataFileTimeOut(path, functionPass, pathPass) {
  try {
    // Read file json
    let dataFile: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${path}`);
    // Check if the json file urlDetailsWareHouse.json has data, if file no data -> get data in function crawlUrlWareHouse()
    if (Object.keys(dataFile).length === 0 || dataFile.constructor === Object) {
      dataFile = await functionPass();
    } else {
      dataFile = JSON.parse(dataFile);
      let dataTimeout: any = await readDataFileIfExists(`${FOLDER_FILE_DATA}/${FOLDER_DEBUG}/${pathPass}`);
      dataTimeout = JSON.parse(dataTimeout);
      const checkStatus = dataTimeout.find((url) => url.status === 0);
      if (checkStatus) {
        dataFile = await functionPass();
      }
    }

    return dataFile;
  } catch (error) {
    winston.info(error);
  }
}

async function waitingTime() {
  return await new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, TIMEOUT_BETWEEN_REQUEST);
  });
}

export { crawlDetailWarehouses, removeFolderLogs, readDataFileIfExists, createFileIfNotExists, createFolderIfNotExists, getCrawlInfo, getResponseWhileCrawling, createFolderLogs };
