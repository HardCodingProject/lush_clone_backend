// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// AXIOS 모듈
const axios = require('axios');

// SELENIUM 모듈
const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder()
        .forBrowser('firefox')
        .build();
    try {
        // 러쉬 홈페이지 실행
        await driver.get('https://www.lush.co.kr/goods/goods_list.php?cateCd=001007011');

        // Javascript를 실행하여 UserAgent를 확인한다.
        let userAgent = await driver.executeScript("return navigator.userAgent;")
        console.log('[UserAgent]', userAgent);

        // 팝업창을 종료하기 위한 변수
        let exitBanner = await driver.findElements(By.css('div#grb-close-x'));
        await exitBanner[0].click();

        // 제품 상세페이지로 들어가기 위한 링크를 저장하는 변수
        const productURL = await driver.findElements(By.css('div.txt a'));
        console.log(productURL.length);

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
            console.log("==============" + i + "번째 =============");
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

            // 상세 페이지의 데이터를 저장하기 위한 변수를 설정한다.
            const productName = await driver.findElement(By.css('div.tit > h2'));
            const productTag = await driver.findElement(By.css('div.hashtag'));
            const productPrice = await driver.findElement(By.css('li.price > div > strong'));
            const productWeight = await driver.findElement(By.xpath('//*[@id="frmView"]/div/div/div[3]/ul/li[2]/div/span'));
            const productCategory = await driver.findElement(By.xpath('//*[@id="content"]/div[2]/div[1]/div/div[3]/div/a'));

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
                productCategory: await productCategory.getText()
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
                    price: productPrice, // 물품 가격
                    weight: productWeight, // 물품 무게
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