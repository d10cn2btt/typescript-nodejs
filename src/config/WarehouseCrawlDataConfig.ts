const URL_HOME_PAGE = 'https://www.cbre-propertysearch.jp';
const URL_PROVINCES = URL_HOME_PAGE + '/industrial';

const LIST_PROVINCES = {
  DOM_LAYOUT_PROVINCES: '#contents > div.topArea > div',
  DOM_URL_PROVINCES: 'div > div > div > ul > li',
};

const LIST_WAREHOUSES = {
  DOM_PROVINCES: '#contents > div > div.propertyList > div > div.itemGroup >.item',
  DOM_WAREHOUSES: 'div.inner > div > div.body > div.head > h2 > a',
  DOM_ITEM_PROVINCES: '#contents > div > div.propertyList > div > div.itemGroup > div',
  DOM_LIST_PROVINCES: 'div > div > div.body > div.head > h2 > a',
  DOM_OTHER_INFORMATION: 'div > div > div.body > div.info > div > table > tbody > tr',
  DOM_TOTAL_PAGING: '#contents > div > div.propertyList > div > div.propertyListTools > div.group > div.paginate > ul > li:last-child > a',
  DOM_URL_WAREHOUSES: '#contents > div > div.propertyList > div > div.itemGroup > div > div.inner > div > div.body > div.head > h2',
};

const DETAILS_WAREHOUSE = {
  DOM_IMAGES: '#contents > div > div.columnSection.clearfix > div > div.imgSection > div > div.photo > div.inner > div > div',
  DOM_TABLES: '#contents > div > div.columnSection.clearfix > div > div.bodySection > table > tbody > tr',
};

export { URL_HOME_PAGE, URL_PROVINCES, LIST_PROVINCES, LIST_WAREHOUSES, DETAILS_WAREHOUSE };
