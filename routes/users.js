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
  await driver.get('https://lush.co.kr/board/list.php?memNo=&noheader=&searchField=subject&searchWord=&bdId=shop');
  
  // 팝업창 종료
  let exitBanner = await driver.findElements(By.xpath('//*[@id="grb-close-x"]'));
  await exitBanner[0].click();

  const result = await driver.findElements(By.xpath('//*[@id="content"]/div/div[2]/div[2]/nav/ul/li/a')); 
  console.log(result.length); 8

  //여기에 한번크롤링 실행
  for(let i = 0; i < result.length; i++){
    const result = await driver.findElements(By.xpath('//*[@id="content"]/div/div[2]/div[2]/nav/ul/li/a'));
    await result[i].click();
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