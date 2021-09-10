var express = require('express');
var router = express.Router();

// SELENIUM-WEBDRIVER
const webdriver = require('selenium-webdriver');
const { By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// AXIOS
const axios = require('axios');

// ASYNC METHOD
const run = async () => {
  // 크롬 자동화 설치
  const service = new chrome.ServiceBuilder('./driver/chromedriver.exe').build();
  chrome.setDefaultService(service);
  const driver = await new webdriver.Builder().forBrowser('chrome').build();

  // 크롬에 주소 입력
  await driver.get('https://lush.co.kr/goods/goods_list.php?cateCd=001013');

  // 화면에 표시되는 항목 URL 크롤링
  let exitBanner = await driver.findElements(By.css('div#grb-close-x'));
  const result = await driver.findElements(By.css('div.list > ul.prdList > li'));

  await exitBanner[0].click();

  const list = new Array();
  for (let i = 0; i < result.length; i++) {
    const productURL = await result[i].findElement(By.css('div.txt > a')).getAttribute('href');
    list.push(productURL);
  }

  console.log(list);

  for (let i = 0; i < result.length; i++) {
    console.log("============" + (i + 1) + "============");
    await result[i].click();

    // 4초간 정지
    setTimeout(async () => { }, 4000);

    const productName = await driver.findElement(By.css('div.tit > h2'));

    console.log(productName.getText());


    try {
      await driver.wait(() => { return false; }, 10000);
    } catch (error) {
      console.error(error);
    }


    driver.navigate().back();


    try {
      await driver.wait(() => { return false; }, 10000);
    } catch (error) {
      console.error(error);
    }
  }

  // 4초후 종료
  setTimeout(async () => {
    await driver.quit();
    process.exit(0);
  }, 4000);
}

// METHOD CALL
run();

module.exports = router;