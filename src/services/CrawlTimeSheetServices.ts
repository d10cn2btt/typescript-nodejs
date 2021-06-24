import puppeteer from 'puppeteer';
import winston from '../config/winston';
import C from './Constant';
import ACCOUNT from './ConstantAccountSelector';

async function timeSheetServices() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // const websiteContent = await page.content();
  await page.goto('https://wsm.sun-asterisk.vn/en/dashboard/user_timesheets');
  await page.click('a[class="wsm-btn btn-login"]');
  await page.click(ACCOUNT.USERNAME_SELECTOR);
  await page.keyboard.type(C.username);
  await page.click(ACCOUNT.PASSWORD_SELECTOR);
  await page.keyboard.type(C.password);
  await page.click(ACCOUNT.CTA_SELECTOR);

  setTimeout(async()=>{
    const electronicData = await page.evaluate(() => {
      // @ts-ignore
      const test = document.querySelector('div[class="page-content"] > a > div').style.backgroundImage;
      return test;
    });
    winston.info(electronicData);
  }, 5000);

  setTimeout(async() =>{
    await page.click('#user_timesheets_picker');
    await page.click(
      'body > div.datepicker.datepicker-dropdown.dropdown-menu.datepicker-orient-left.datepicker-orient-top > div.datepicker-months > table > tbody > tr > td > span:nth-child(6)'
    );
    setTimeout(async() =>{
      const electronicData = await page.evaluate(() => {
        const products = [];
        const data = document.querySelectorAll('.event-timesheets');

        data.forEach((product) => {
          const dataJson = {};
          try {
            // @ts-ignore
            dataJson.checkIn = product.querySelector('.event-in.check-time.event-time-in.col-md-6.col-xs-6.col-sm-6').innerText;
            // @ts-ignore
            dataJson.checkOut = product.querySelector('.event-out.check-time.event-time-out.col-md-6.col-xs-6.col-sm-6').innerText;
          }
          catch (err) {
            winston.info(err);
          }
          products.push(dataJson);
        });
        return products;
      });
      winston.info(electronicData);
    }, 3000);
  }, 7000);
}

export { timeSheetServices };


