const URL_PROVINCES = 'https://www.cbre-propertysearch.jp/industrial';

const LIST_PROVINCES = {
  DOM_PROVINCE: '#contents > div > div.propertyList > div > div.itemGroup >.item',
  DOM_WAREHOUSE: 'div.inner > div > div.body > div.head > h2 > a',
  DOM_ITEM_CITY: '#contents > div > div.propertyList > div > div.itemGroup > div',
  DOM_CITY: 'div > div > div.body > div.head > h2 > a',
  DOM_OTHER_INFORMATION: 'div > div > div.body > div.info > div > table > tbody > tr',
};

const LIST_STORES = {
  DOM_IMAGE: '#contents > div > div.columnSection.clearfix > div > div.imgSection > div > div.photo > div.inner > div > div',
  DOM_TABLE: '#contents > div > div.columnSection.clearfix > div > div.bodySection > table > tbody > tr',
};

export { URL_PROVINCES, LIST_PROVINCES, LIST_STORES };
