import winston from '../config/winston';
import request_promise from 'request-promise';
import cheerio from 'cheerio';
import { URL_HOME_PAGE, URL_PROVINCES, LIST_PROVINCES, LIST_WAREHOUSES, DETAILS_WAREHOUSE } from '../config/WarehouseCrawlDataConfig';
import { FOLDER_FILE_JSON, FILE_PROVINCES, FILE_URL_PROVINCES, FILE_URL_WAREHOUSE, FILE_DATA_WAREHOUSE, TIMEOUT_BETWEEN_REQUEST, FILE_STATUS_CRAWL, FILE_TIME } from '../config/ConstFileJson';
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
    await writeFile(`${FOLDER_FILE_JSON}/${FILE_PROVINCES}`, JSON.stringify(urlProvinces));
    winston.info('[crawl success data url provinces]');

    return urlProvinces;
  } catch (err) {
    winston.info(err);
  }
}

async function saveUrlProvinces() {
  let urlProvince = [];
  await createPath(`${FOLDER_FILE_JSON}/${FILE_PROVINCES}`);
  const provinces = await getDataFileNotTimeOut(`${FILE_PROVINCES}`, crawlUrlProvinces);
  const dataFileUrlProvince = await readDataFile(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`);
  if (Object.keys(dataFileUrlProvince).length !== 0 && dataFileUrlProvince.constructor !== Object) {
    urlProvince = JSON.parse(dataFileUrlProvince);
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
        urlProvince.push({
          url: optionsPaging.uri,
          status: 0,
        });
        province.status = 1;

        await writeFile(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`, JSON.stringify(urlProvince));
        winston.info(`save url ${optionsPaging.uri} done !`);

        await writeFile(`${FOLDER_FILE_JSON}/${FILE_PROVINCES}`, JSON.stringify(provinces));
      }
    } catch (error) {
      winston.info(error);
    }
  }
  winston.info('[crawl success url province]');
  return urlProvince;
}

async function crawlUrlWareHouses() {
  winston.info('[start crawl url warehouse]');
  let urlWarehouse = [];
  await createPath(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`);
  winston.info('aaaaaa');
  const urlProvinces = await getDataFileTimeOut(`${FILE_URL_PROVINCES}`, saveUrlProvinces, FILE_PROVINCES);
  const dataFileUrlWarehouse = await readDataFile(`${FOLDER_FILE_JSON}/${FILE_URL_WAREHOUSE}`);

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

    await writeFile(`${FOLDER_FILE_JSON}/${FILE_URL_WAREHOUSE}`, JSON.stringify(urlWarehouse));
    winston.info(`save url warehouse: ${optionsPaging.uri} done !`);

    await writeFile(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`, JSON.stringify(urlProvinces));
  }

  return urlWarehouse;
}

async function detailWarehouses(statusCrawl) {
  try {
    winston.info('[start crawl detail warehouse]');
    await createPath(`${FOLDER_FILE_JSON}/${FILE_DATA_WAREHOUSE}`);

    // read file dataWarehouse.json . If data file dataWarehouse = data file output.json, else dataWarehouse = []
    const dataFileWarehouse = await readDataFile(`${FOLDER_FILE_JSON}/${FILE_DATA_WAREHOUSE}`);
    let dataWarehouse = [];
    if (Object.keys(dataFileWarehouse).length !== 0 && dataFileWarehouse.constructor !== Object) {
      dataWarehouse = JSON.parse(dataFileWarehouse);
    }

    await createPath(`${FOLDER_FILE_JSON}/${FILE_URL_WAREHOUSE}`);
    // await createPath(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`);
    // winston.info('1111', await createPath(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`));
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
      };
      const resultProvince = await request_promise(optionsWarehouse);
      const operator = cheerio.load(resultProvince);
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

      // fee
      const fee = {
        key: '賃料',
        value: null,
      };
      warehouse.push(fee);

      // storyBelow
      const storyBelow = {
        key: '地下階数',
        value: null,
      };
      warehouse.push(storyBelow);

      // locationFloor
      const locationFloor = {
        key: '所在階',
        value: null,
      };
      warehouse.push(locationFloor);

      // commonFee
      const commonFee = {
        key: '共益費',
        value: null,
      };
      warehouse.push(commonFee);

      // isAvailable
      const isAvailable = {
        key: '今すぐ契約可能かどうか',
        value: true,
      };
      warehouse.push(isAvailable);

      // informationProvider
      const informationProvider = {
        key: '情報提供元',
        value: null,
      };
      warehouse.push(informationProvider);

      // sourcePath
      const sourcePath = {
        key: 'ソースパス',
        value: dataUrl.url,
      };
      warehouse.push(sourcePath);

      // warehouseEquipment
      const warehouseEquipment = [];
      operator('#contents > div > div.columnSection.clearfix > div > div.bodySection > ul.icons > li').each(function () {
        warehouseEquipment.push(normalizeText(operator(this).text()));
      });
      warehouse.push({
        key: '倉庫設備',
        value: warehouseEquipment,
      });

      // WarehouseAccess
      const warehouseAccess = {
        nearestStations: {
          stationName: null,
          transitMinute: null,
          walkingMinute: null,
        },
        nearestInterchanges: {
          highwayName: null,
          interchangeName: null,
          distanceKm: null,
        },
      };
      warehouse.push({
        key: '倉庫へのアクセス',
        value: warehouseAccess,
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
      const customerData = {
        name: customer.name,
        fee: customer.fee,
        area: customer.area,
        storyAbove: customer.storyAbove,
        storyBelow: customer.storyBelow,
        locationFloor: customer.locationFloor,
        commonFee: customer.commonFee,
        equipments: customer.equipments,
        isAvailable: customer.isAvailable,
        informationProvider: customer.informationProvider,
        access: customer.access,
        sourcePath: customer.sourcePath,
        address: customer.address,
      };

      dataWarehouse.push(customerData);

      await writeFile(`${FOLDER_FILE_JSON}/${FILE_DATA_WAREHOUSE}`, JSON.stringify(dataWarehouse));

      await writeFile(`${FOLDER_FILE_JSON}/${FILE_URL_WAREHOUSE}`, JSON.stringify(dataUrlWareHouses));
      await waitingTime();
      const dateTimeRequest = (Date.now() - timeStartCrawl) / 1000;
      winston.info({
        'Request time': dateTimeRequest,
      });
    }
    // Check if the file has been crawled or not, if crawled, turn it OFF
    statusCrawl = 'OFF';
    await writeFile(`${FOLDER_FILE_JSON}/${FILE_STATUS_CRAWL}`, statusCrawl);
    winston.info('[crawl success data details ware house]');

    return [dataWarehouse];
  } catch (error) {
    winston.info(error);
  }
}

async function resetFolderLogs() {
  createFolder(`eck`);
}

async function removeFolderLogs() {
  removeFile(`${FOLDER_FILE_JSON}/${FILE_PROVINCES}`);
  removeFile(`${FOLDER_FILE_JSON}/${FILE_URL_PROVINCES}`);
  removeFile(`${FOLDER_FILE_JSON}/${FILE_URL_WAREHOUSE}`);
  removeFile(`${FOLDER_FILE_JSON}/${FILE_DATA_WAREHOUSE}`);
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

async function createFolder(folder) {
  if (!fs.existsSync(folder)) {
    mkdir(folder);
  }
}

async function removeFile(path) {
  if (fs.existsSync(path)) {
    return unlink(path);
  }
}

async function createPath(path) {
  // Check if the file exists or not
  if (!fs.existsSync(path)) {
    // Create file;
    writeFile(path, '');
  }
}

async function readDataFile(path) {
  if (fs.existsSync(path)) {
    return readFile(path, 'utf-8');
  } else {
    winston.info(`File ${path} not exit`);
  }
}

async function getDataFileNotTimeOut(path, functionPass) {
  // Read file json
  let data: any = await readDataFile(`${FOLDER_FILE_JSON}/${path}`);
  // Check if the json file urlDetailsWareHouse.json has data, if file no data -> get data in function crawlUrlWareHouse()
  if (Object.keys(data).length === 0 || data.constructor === Object) {
    data = await functionPass();
  } else {
    data = JSON.parse(data);
  }

  return data;
}

async function getDataFileTimeOut(path, functionPass, pathPass) {
  try {
    // Read file json
    let data: any = await readDataFile(`${FOLDER_FILE_JSON}/${path}`);
    winston.info('55555', data);
    // Check if the json file urlDetailsWareHouse.json has data, if file no data -> get data in function crawlUrlWareHouse()
    if (Object.keys(data).length === 0 || data.constructor === Object) {
      data = await functionPass();
      winston.info('6666', data);
    } else {
      data = JSON.parse(data);
      let dataTimeout: any = await readDataFile(`${FOLDER_FILE_JSON}/${pathPass}`);
      dataTimeout = JSON.parse(dataTimeout);
      const checkStatus = dataTimeout.find((url) => url.status === 0);
      if (checkStatus) {
        data = await functionPass();
      }
    }

    return data;
  } catch (error) {
    winston.info(error);
  }
}

async function waitingTime() {
  return await new Promise((resolve: any) => {
    setTimeout(() => {
      winston.info('waitingTime');
      resolve();
    }, TIMEOUT_BETWEEN_REQUEST);
  });
}

export { detailWarehouses, removeFolderLogs, readDataFile, createPath, createFolder };
