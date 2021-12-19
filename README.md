# Problems and Solutions

---

## 회원가입 시 보안을 위해 비밀번호 암호화 작업
### 1. 문제정의
- 암호화를 하지 않고 비밀번호를 그대로 DB에 넣었을 경우, 보안 문제가 발생

### 2. 사실수집
- POSTMAN을 실행하고 회원가입에 대한 필요정보를 입력한 후, 회원가입 주소를 입력한 후 POST메서드로 전송을 할 경우 MongoDB에 입력받은 비밀번호가 그대로 저장되는 것을 확인
- `SQL injection`과 같은 공격이 발생했을 경우 암호화를 하지 않으면 사용자의 비밀번호가 그대로 노출되는 상황이 발생할 것으로 예상

### 3. 원인추론
- 암호화 과정을 수행하는 코드 미작성

### 4. 조사방법결정
- Node.js의 내장 모듈인 Crypto를 사용하여 암호화하는 방법을 조사

### 5. 조사방법구현
``` JavaScript
// 회원가입 => 아이디, 비밀번호, 비밀번호확인, 이름, 이메일, 휴대폰번호, 우편번호, 배송주소
// POST > localhost:3000/member/join
router.post('/join', async function (req, res, next) {
    try {
        // 1. 비밀번호 암호화 => 아이디 값은 고유하기 때문에 솔트 값으로 지정
        const salt = req.body.id;
        const hashPassword = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');
  
        // 2. 전달되는 값 받기(아이디, 비밀번호, 이름, 이메일, 휴대폰번호, 우편번호, 배송주소, 등록일자)
        const memberData = {
            _id: req.body.id,
            password: hashPassword,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            zip_code: req.body.zip_code,
            shipping_address: req.body.shipping_address,
            regdate: new Date()
        }

        // 3. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 4. DB에 memberData 저장
        const result = await collection.insertOne(memberData);

        // 5. DB닫기
        dbconn.close();

        // 6. 결과 리턴
        if (result.insertedId === memberData._id) {
            res.send({ ret: 1, data: `${memberData.name}님의 회원가입을 축하합니다.` });
        } else {
            res.send({ ret: 0, data: '회원가입을 실패했습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});
```
- `const hashPassword = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');`
-  SHA256을 사용한 암호화를 수행, 여기서 비밀키는 회원의 아이디로 설정(유일성)
-  HMAC SHA256의 경우 데이터를 주어진 salt값과 함께 해싱을 수행하고, 해싱된 결과물을 salt값과 한번 더 해싱을 수행함 => 해시의 보안이 강화되는 결과를 확인할 수 있음

### 6. 문제해결
- Node.js의 내장 모듈인 Crypto를 사용하여 비밀번호 암호화를 수행한 후 DB에 데이터를 저장하는 방법으로 변경
- **[적용 후 사진]**
![image](https://user-images.githubusercontent.com/38236367/146666592-72d198e2-8829-431a-b764-33321ffb4510.png)

---

## 로그인 시 토큰 발행 문제
### 1. 문제정의
- 로그인 후, 사용자 인증을 위한 토큰 발행 문제가 발생

### 2. 사실수집
- 사용자 인증을 위한 토큰발행 기능이 없기 때문에, 클라이언트는 사용자 인증을 위해 서버에 계속해서 요청해야하는 불편함 발생

### 3. 원인추론
- 토큰을 발행하고 저장하는 코드 미작성

### 4. 조사방법결정
- JSON Web Token을 조사하고 프로젝트에 적용하기로 결정

### 5. 조사방법구현
``` JavaScript
const jwt = require('jsonwebtoken');

// 로그인
// POST > localhost:3000/member/login
router.post('/login', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.body.id;
        const password = req.body.password;

        // 2. 비밀번호는 해쉬 후 DB데이터와 비교
        const salt = req.body.id;
        const hashPassword = crypto.createHmac('sha256', salt).update(password).digest('hex');

        // 3. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 4. DB조회
        const query = { _id: id, password: hashPassword };
        const result = await collection.findOne(query);

        console.log("결과" , result);
        // 5. 결과 값에 따라 토큰 생성
        if (typeof (result) !== 'undefined') {
            // 5-1. 토큰에 저장되는 내용
            const payload = {
                idx: result._id,
                name: result.name
            };

            // 5-2. DB에 생성한 토큰을 UPDATE
            const resultToken = {
                token: jwt.sign(payload, secretKey, options),
                refreshToken: randToken.uid(256)
            }

            const tokenQuery = { _id: id };
            const changeData = { $set: { token: resultToken } };
            const tokenResult = await collection.updateOne(tokenQuery, changeData);
            if (tokenResult.modifiedCount === 1) {
                res.send({ ret: 1, jwtToken: resultToken });
            } else { 
                res.send({ ret: 0, data: 'token not issued' });
            }
        } else {
            res.send({ ret: 0, data: 'token not issued' });
        }

        // 6. DB닫기
        dbconn.close();
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});
```
``` JavaScript
module.exports = {
    secretKey : 'SaltValue', // salt값
    options   : {
        algorithm : 'HS256',  // hash 알고리즘
        expiresIn : '24h',    // 발행된 토큰의 유효시간(24시간)
        issuer    : 'admin'   // 발행자
    }
}
```
- **[JWT 사용이유]**
  - 토큰을 인증 값으로 사용하게 되면 기존 쿠키/세션을 사용하는 방식보다 많은 보안 이슈를 막을 수 있음
  - JWT는 기존의 XML보다 덜 복잡하고 인코딩 된 사이즈가 작다는 장점이 있음 => HTTP, HTML환경에서 사용하기 적합
  - JSON parser는 대부분의 프로그래밍을 지원한다는 장점이 있음
- `token: jwt.sign(payload, secretKey, options),`
  - payload: 아이디 비밀번호 등 사용자에 대한 정보가 들어간 객체
  - secretKey: 여러가지 복잡한 문자열로 되어있는 키
  - options: 토큰에 대한 여러가지 정보를 설정, 현재 설정되어 있는 정보는 만료일, 알고리즘 방식, 

### 6. 문제해결
- jwt.sign메서드를 사용하여 토큰값을 생성하고 이를 DB에 저장하도록 설정
- **[적용 후 사진]**
![image](https://user-images.githubusercontent.com/38236367/146667695-9d70427f-da3b-42e7-9294-cf304a06ddc1.png)

---
## 셀레니움을 활용한 러쉬 물품 목록 크롤링
### 1. 문제정의
- 러쉬 물품 정보 수집을 위한 반복적인 작업에 대한 피로도 상승
- 크롤링 기능을 활용하여 원하는 물품 정보를 수집할 수 있도록 설정하고 싶음

### 2. 사실수집
- cheerio를 사용하여 크롤링을 수행할 경우 원하는 페이지에서 프로그램을 실행해줘야한다는 단점이 발생
- 코드에서 크롤링하고 싶은 URL을 변경해줘야한다는 단점이 발생

### 3. 원인추론
- cheerio를 사용하여 크롤링을 할 경우 반 자동적으로 크롤링을 수행해야함

### 4. 조사방법결정
- cheerio크롤링 => selenium크롤링 방법으로 변경
- 위 방식으로 변경할 경우, 태그 설정을 통한 크롤링 자동화를 기대할 수 있음

### 5. 조사방법구현
``` JavaScript
// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'URL Path';

// AXIOS 라이브러리
const axios = require('axios');

// SELENIUM 라이브러리
const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder().forBrowser('firefox').build();
    
    try {
        // 러쉬 홈페이지 실행
        await driver.get('https://www.lush.co.kr/goods/goods_list.php?cateCd=001001001');

        // Javascript를 실행하여 UserAgent를 확인한다.
        let userAgent = await driver.executeScript("return navigator.userAgent;")
        console.log('[UserAgent]', userAgent);

        // 팝업창을 종료하기 위한 변수
        let exitBanner = await driver.findElements(By.css('div#grb-close-x'));
        await exitBanner[0].click();

        // 제품 상세페이지로 들어가기 위한 링크를 저장하는 변수
        const productURL = await driver.findElements(By.css('div.txt a'));

        // 페이지 로딩을 위해 2초간 대기한다.
        try {
            await driver.wait(() => { return false; }, 2000);
        } catch (error) {
            console.error(error);
        }

        // 타입을 받아오기 위한 변수 설정
        const productTypeList = new Array();

        const productType = await driver.findElements(By.css('span.hot'));
        for (let i = 0; i < productURL.length; i++) {
            const productTypeImage = await productType[i].findElements(By.css('a > img'));

            const tempData = new Array();
            for (let j = 0; j < productTypeImage.length; j++) {
                const productTypeUrl = await productTypeImage[j].getAttribute('src');
                const productTypeText = await productTypeImage[j].getAttribute('title');

                const response = await axios.get(productTypeUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'utf-8');

                const obj = {
                    productTypeImage: productTypeUrl,
                    productTypeText: productTypeText,
                    buffer: buffer
                }
                tempData.push(obj);
            }
            productTypeList.push(tempData);
            console.log(productTypeList);
        }

        // MONGODB에 저장하기 위한 리스트 객체 생성
        const productList = new Array();

        // URL을 크롤링한 개수만큼 반복문을 수행한다.
        for (let i = 0; i < productURL.length; i++) {
            // 뒤로가기 버튼을 클릭하면 초기화되기 때문에 한번 더 호출해준다.
            const productURL = await driver.findElements(By.css('div.list > ul.prdList > li'));

            // URL을 클릭해서 상세 페이지로 이동한다.
            await productURL[i].click();

            // 페이지 로딩을 위해 2초간 대기한다.
            try {
                await driver.wait(() => { return false; }, 2000);
            } catch (error) {
                console.error(error);
            }

            // 이미지를 큰 사이즈로 가져오기 위해 서브 이미지를 클릭한다.
            let productImages = await driver.findElements(By.css('div.slick-track > span.swiper-slide > a > img.middle'));
            const productImageList = new Array();
            for (let i = 0; i < productImages.length; i++) {
                // 작은 이미지 중 i번째 이미지 클릭
                await productImages[i].click();

                // i번째 이미지 가져오기
                const productImage = await driver.findElement(By.css('div.thumbnail > a > img')).getAttribute('src');

                // 이미지 데이터 변환
                const response = await axios.get(productImage, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'utf-8');

                // productImageList에 담기
                const productImageTemp = {
                    productImage: productImage,
                    buffer: buffer
                }

                // List에 저장하기
                productImageList.push(productImageTemp);
            }

            for (let i = 0; i < productImageList.length; i++) {
                console.log(productImageList[i]);
            }
 //*[@id="content"]/div[2]/div[1]/div/div[3]/div/a
            // 상세 페이지의 데이터를 저장하기 위한 변수를 설정한다.
            const productName = await driver.findElement(By.css('div.tit > h2'));
            const productTag = await driver.findElement(By.css('div.hashtag'));
            const productPrice = await driver.findElement(By.css('li.price > div > strong'));
            const productWeight = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div/div[2]/div[2]/form/div/div/div[3]/ul/li[2]/div/span'));
            // const productCategory = await driver.findElement(By.xpath('//*[@id="content"]/div[2]/div[1]/div/div[3]/div/a'));

            // PRODUCT DATA
            const productData = {
                productTypeFirst: productTypeList[i][0],
                productTypeSecond: productTypeList[i][1],
                productImageFirst: productImageList[0],
                productImageSecond: productImageList[1],
                productName: await productName.getText(),
                productTag: await productTag.getText(),
                productPrice: await productPrice.getText(),
                productWeight: await productWeight.getText(),
                productCategory: '배쓰 밤'
            }

            productList.push(productData);

            // 뒤로가기 버튼 클릭
            driver.navigate().back();

            // 페이지 로딩을 위해 2초간 대기
            try {
                await driver.wait(() => { return false; }, 2000);
            } catch (error) {
                console.error(error);
            }
        }

        console.log(productList);

        // MONGO DB에 크롤링데이터 넣기
        try {
            // 몇회 데이터가 입력되었는지 비교하기 위한 변수
            let count = 0;

            for (let i = 0; i < productList.length; i++) {
                // 1. SEQ_PRODUCT_CODE의 값을 가져오기 위한 DB연결
                const dbconn = await mongoClient.connect(mongourl);
                var collection = dbconn.db('id304').collection('seq_lush_product');

                // 2. _id의 값이 'SEQ_PRODUCT_CODE'인 항목을 찾고 값을 1증가
                var result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_CODE' }, { $inc: { seq: 1 } });

                let productTypeSecond = null;
                let productImageSecond = null;
                let productWeight = 0;
                let productPrice = 0;

                // Type 이미지 처리
                if (typeof (productList[i].productTypeSecond) === 'undefined') {
                    productTypeSecond = null;
                } else {
                    productTypeSecond = productList[i].productTypeSecond;
                }

                // Product 이미지 처리
                if (typeof (productList[i].productImageSecond) === 'undefined') {
                    productImageSecond = null;
                } else {
                    productImageSecond = productList[i].productImageSecond;
                }

                // 무게 숫자 처리
                let tempWeight = productList[i].productWeight;
                productWeight = tempWeight.replace(/g/gi, "");

                // 가격 숫자 처리
                let tempPrice = productList[i].productPrice;
                productPrice = tempPrice.replace(/￦|,/gi, "");

                const productData = {
                    _id: result.value.seq, // 물품 코드
                    category_code: productList[i].productCategory, // 카테고리 코드
                    name: productList[i].productName, // 물품명
                    price: parseInt(productPrice), // 물품 가격
                    weight: parseInt(productWeight), // 물품 무게
                    tag: productList[i].productTag, // 물품 태그
                    image_first: productList[i].productImageFirst,
                    image_second: productImageSecond,
                    type_first: productList[i].productTypeFirst,
                    type_second: productTypeSecond,
                    regdate: new Date() // 물품등록 날짜
                }

                // 3. DB연결
                collection = dbconn.db('id304').collection('lush_product');
                result = await collection.insertOne(productData);

                // 4. 올바르게 들어갈 경우 count 값 증가
                if (result.insertedId === productData._id) {
                    count++;
                }

                // 5. DB닫기
                dbconn.close();
            }

            // 6. 결과 값 리턴
            if (count === productList.length) {
                console.log({ ret: 1, data: `${count}개의 데이터가 저장되었습니다.` });
            } else {
                console.log({ ret: 0, data: '데이터 저장을 실패했습니다.' });
            }
        } catch (error) {
            console.error(error);
        }
    }
    finally {
        // 브라우저 종료
        driver.quit();
    }
})();
```
- **[셀레니움]**
  - 웹 사이트 테스트를 위한 도구로 브라우저 동작을 자동화 할 수 있음
  - 이점을 활용하여 웹 크롤링을 수행, 프로그래밍으로 브라우저의 동작을 제어해서 페이지의 정보를 크롤링할 수 

### 6. 문제해결
- 셀레니움을 통한 자동화 크롤링 시스템을 사용하여, 원하는 정보만 가져온 후 DB에 저장
- 자동화 로봇이 대신 크롤링을 수행해주기 정보를 수집하는데 편리성 증가
- 하지만, 태그로 접근하기 때문에 동일한 페이지라도 다른 태그를 사용했을 경우 해당 정보는 크롤링되지 않고 넘어가는 경우가 발생할 수 있음
