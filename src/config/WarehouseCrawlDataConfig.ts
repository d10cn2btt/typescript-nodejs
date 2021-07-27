const URL_HOME_PAGE = 'https://www.cbre-propertysearch.jp';
const URL_PROVINCES = URL_HOME_PAGE + '/industrial';

const LIST_PROVINCES = {
  DOM_LAYOUT_PROVINCE: '#contents > div.topArea > div',
  DOM_URL_PROVINCE: 'div > div > div > ul > li',
};

const LIST_WARE_HOUSE = {
  DOM_PROVINCE: '#contents > div > div.propertyList > div > div.itemGroup >.item',
  DOM_WAREHOUSE: 'div.inner > div > div.body > div.head > h2 > a',
  DOM_ITEM_CITY: '#contents > div > div.propertyList > div > div.itemGroup > div',
  DOM_CITY: 'div > div > div.body > div.head > h2 > a',
  DOM_OTHER_INFORMATION: 'div > div > div.body > div.info > div > table > tbody > tr',
  DOM_TOTAL_PAGING: '#contents > div > div.propertyList > div > div.propertyListTools > div.group > div.paginate > ul > li:last-child > a',
  DOM_URL_WARE_HOUSE_: '#contents > div > div.propertyList > div > div.itemGroup > div > div.inner > div > div.body > div.head > h2',
};

const LIST_DETAILS_WARE_HOUSE = {
  DOM_IMAGE: '#contents > div > div.columnSection.clearfix > div > div.imgSection > div > div.photo > div.inner > div > div',
  DOM_TABLE: '#contents > div > div.columnSection.clearfix > div > div.bodySection > table > tbody > tr',
};

// const LIST_STORES = {
//   DOM_IMAGE: '#contents > div > div.columnSection.clearfix > div > div.imgSection > div > div.photo > div.inner > div > div',
//   DOM_TABLE: '#contents > div > div.columnSection.clearfix > div > div.bodySection > table > tbody > tr',
//   DOM_TOTAL_PAGING: '#contents > div > div.propertyList > div > div.propertyListTools > div.group > div.paginate > ul > li:last-child > a',
//   DOM_URL_WARE_HOUSE_: '#contents > div > div.propertyList > div > div.itemGroup > div > div.inner > div > div.body > div.head > h2',
// };

export { URL_HOME_PAGE, URL_PROVINCES, LIST_PROVINCES, LIST_WARE_HOUSE, LIST_DETAILS_WARE_HOUSE };
