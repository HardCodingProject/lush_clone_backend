var express = require('express');
var router = express.Router();

// npm install mongodb --save
const mongoclient = require('mongodb').MongoClient;
const mongourl = "mongodb://id300:pw300@1.234.5.158:37017/id300";
const mongodb = "id300";
const mongocoll = "image8";

// npm install axios --save
const axios = require('axios');

// npm install selenium-webdrvier --save
const webdriver = require('selenium-webdriver');
const { By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const run = async () => {
    // 크롬 자동화 설치
    const service = new chrome.ServiceBuilder('../driver/chromedriver.exe').build();
    chrome.setDefaultService(service);
    const driver = await new webdriver.Builder().forBrowser('chrome').build();

    // 크롬에 원하는 주소 입력
    await driver.get('https://www.lush.co.kr/board/view.php?memNo=&noheader=&searchField=subject&searchWord=&bdId=shop&sno=78');


    const title = await driver.findElement(By.xpath('//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[5]'));
    const url = await driver.findElement(By.xpath('//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[5]/span[2]'));

    console.log(await title.getText());
    console.log(await url.getText());

    setTimeout(async () => {
        await driver.quit();
        process.exit(0);
    }, 5000); //3000 => 3초
}

// 함수 실행하기
run();


module.exports = router;