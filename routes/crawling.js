var express = require('express');
var router = express.Router();

//npm install mongodb --save
const mongoclient = require('mongodb').MongoClient;
const mongourl  = "mongodb://id318:pw318@1.234.5.158:37017/id318";
const mongodb   = "id318";
const mongocoll = "REPLY";


//axios와 같은 기능
//npm install node-fetch --save
//const fetch = require('node-fetch');

//npm install axios --save
const axios = require('axios');

//모듈 가져오기
//npm install selenium-webdriver --save
const webdriver = require('selenium-webdriver');

//webdriver.By
//바로 가져오는것
const { By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

//async 함수만들기
const run = async () => {
  //db연동
  const dbconn = await mongoclient.connect(mongourl);
  const coll   = dbconn.db(mongodb).collection(mongocoll);

  // 크롬자동화
  const service = new chrome.ServiceBuilder('./driver/chromedriver.exe').build();
  chrome.setDefaultService(service);
  const driver = await new webdriver.Builder().forBrowser('chrome').build();

  //크롬에 원하는 주소입력
  await driver.get('http://www.lush.co.kr/');

  
  //시간 기다렸다가
  await driver.manage().setTimeouts({
    implicit : 7000
  });

  // //팝업창뜨면 끄고
  // await driver.findElement(By.xpath(`//*[@id="ii97"]`)).click();

  // //잠시 기다리고
  // await driver.manage().setTimeouts({
  //   implicit : 2000
  // });

  //메뉴 버튼위치 찾아서 클릭
  await driver.findElement(By.xpath(`//*[@id="header"]/div[1]/div/div[2]/ul/li[3]/a`)).click();

  
 
  //이후 매장 상세 클릭 
  // await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[1]/div/div[1]/a/img`)).click();
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[1]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[2]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[3]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[4]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[5]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[6]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[7]/div/div[1]/a/img
  //*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[8]/div/div[1]/a/img
  //매장 정보들 크롤링

  //
  
  //페이지네이션 수 확인
  let resultElementsPage = await driver.findElements(By.css('ul.pagination > li'));
  // //이미지 수 확인
  let resultElements = await driver.findElements(By.css('div.list > ul >li '));
  

  //페이지네이션 a링크 불러와 저장
  const result = await driver.findElements(By.xpath('//*[@id="content"]/div/div[2]/div[2]/nav/ul/li/a'));
  // console.log(result);

  //첫페이지 8개 데이터받아오기
  for(let j=1; j<=resultElements.length; j++){
    //i번째 클릭
    await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[${j}]/div/div[1]/a/img`)).click();
  
  const title = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[1]`));
  const weekday = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[4]`));
  const weekend = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[5]`));
  const tel = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[8]`));
  const address1 = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[11]`));
  // 
  
   const obj = { 
      title     : await title.getText(),
      weekday   : await weekday.getText(),
      weekend   : await weekend.getText(),
      tel       : await tel.getText(),
      address1  : await address1.getText(),
     
    }


    await coll.insertOne(obj);
    console.log(obj);
    // for(let j=1; j<information.length; j++){
    // console.log(await information[j].getText());
    // console.log("==================")
    
    await driver.navigate().back();
  }
  //*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[1]
  
  //이후 2페이지부터 클릭
  for(let i=0; i<result.length;i++){

    //새로고침된 데이터들 가지고있지않으니 재호출
    const result = await driver.findElements(By.xpath('//*[@id="content"]/div/div[2]/div[2]/nav/ul/li/a'));
    await result[i].click();

    const title = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[1]`));
    const weekday = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[4]`));
    const weekend = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[5]`));
    const tel = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[8]`));
    const address1 = await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/p[11]`));
  
    const obj = { 
      title     : await title.getText(),
      weekday   : await weekday.getText(),
      weekend   : await weekend.getText(),
      tel       : await tel.getText(),
      address1  : await address1.getText(),
     
    }



    for(let j=1; j<=resultElements.length; j++){
      //i번째 클릭
      await driver.findElement(By.xpath(`//*[@id="content"]/div/div[2]/div[2]/div[2]/div/ul/li[${j}]/div/div[1]/a/img`)).click();
      
   

    await coll.insertOne(obj);
    console.log(obj);

      // const information = await driver.findElements(By.css('div.textfield > p > span '));

      // for(let j=1; j<information.length; j++){
      // console.log(await information[j].getText());
      
      // }
      await driver.navigate().back();
    }
    // fs.writeFileSync("lush_json.json",obj);
  }

}
//함수 실행
run();
      





module.exports = router;
