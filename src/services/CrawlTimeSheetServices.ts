import puppeteer from 'puppeteer';
import winston from '../config/winston';
import C from './Constant';


const USERNAME_SELECTOR = '#user_email';
const PASSWORD_SELECTOR = '#user_password';
const CTA_SELECTOR = '#wsm-login-button';

async function timeSheet() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // const websiteContent = await page.content();

  await page.goto('https://wsm.sun-asterisk.vn/en/dashboard/user_timesheets');
  await page.click('a[class="wsm-btn btn-login"]');
  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(C.username);
  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(C.password);
  await page.click(CTA_SELECTOR);


  setTimeout(async()=>{
    const electronicData = await page.evaluate(() => {
      // @ts-ignore
      const test = document.querySelector('div[class="page-content"] > a > div').style.backgroundImage;
      return test;
    });
    winston.info(electronicData);
  }, 3000);
}

export { timeSheet };


