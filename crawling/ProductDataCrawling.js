// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

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

        console.log(productType.length);

        // 이미지 타입을 받아오기 위해 크롤링한 개수만큼 반복문을 수행한다.
        for (let i = 0; i < productURL.length; i++) {
            const productTypeImage = await productType[i].findElements(By.css('a > img'));

            const tempData = new Array();
            for (let j = 0; j < productTypeImage.length; j++) {
                const productTypeUrl = await productTypeImage[j].getAttribute('src');
                const response = await axios.get(productTypeUrl, { responseType: 'arraybuffer' });
                const originalname = response.request.path;
                const filetype = response.headers["content-type"];
                const filedata = Buffer.from(response.data, 'utf-8');

                const obj = {
                    originalname: originalname,
                    filedata: filedata,
                    filetype: filetype
                }
                tempData.push(obj);
            }
            productTypeList.push(tempData);
        }

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

            // 'SEQ_PRODUCT_CODE'의 값을 가져오기 위한 DB연결
            const dbconn = await mongoClient.connect(mongourl);
            var collection = dbconn.db('id304').collection('seq_lush_product');

            // _id의 값이 'SEQ_PRODUCT_CODE'인 항목을 찾고 값을 1증가
            var result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_CODE' }, { $inc: { seq: 1 } });

            // 상세 페이지의 데이터를 저장하기 위한 변수를 설정한다.
            const productCode = result.value.seq;
            const productName = await driver.findElement(By.css('div.tit > h2'));
            const productTag = await driver.findElement(By.css('div.hashtag'));
            const productPrice = await driver.findElement(By.css('li.price > div > strong'));
            const productWeight = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div/div[2]/div[2]/form/div/div/div[3]/ul/li[2]/div/span'));

            const priceTemp = await productPrice.getText();

            // PRODUCT DATA
            const productData = {
                _id: productCode,
                category_code: 2,
                name: await productName.getText(),
                price: parseInt(priceTemp.replace(/\￦|\,/g, '')),
                weight: await productWeight.getText(),
                tag: await productTag.getText(),
                regdate: new Date()
            }

            // 페이지 로딩을 위해 2초간 대기한다.
            try {
                await driver.wait(() => { return false; }, 2000);
            } catch (error) {
                console.error(error);
            }

            // MONGODB에 저장
            collection = dbconn.db('id304').collection('lush_product');
            result = await collection.insertOne(productData);

            // 이미지를 큰 사이즈로 가져오기 위해 서브 이미지를 클릭한다.
            let productImages = await driver.findElements(By.css('div.slick-track > span.swiper-slide > a > img.middle'));
            for (let j = 0; j < productImages.length; j++) {
                // 'SEQ_PRODUCT_iMAGE_NO'의 값을 가져오기 위한 DB연결
                collection = dbconn.db('id304').collection('seq_lush_product_image');

                // _id의 값이 'SEQ_PRODUCT_iMAGE_NO'인 항목을 찾고 값을 1증가
                result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_IMAGE_NO' }, { $inc: { seq: 1 } });

                // 작은 이미지 중 i번째 이미지 클릭
                await productImages[j].click();

                // i번째 이미지 가져오기
                const productImage = await driver.findElement(By.css('div.thumbnail > a > img')).getAttribute('src');

                // 이미지 데이터 변환
                const productImageNo = result.value.seq;
                const response = await axios.get(productImage, { responseType: 'arraybuffer' });
                const originalname = response.request.path;
                const filetype = response.headers["content-type"];
                const filedata = Buffer.from(response.data, 'utf-8');

                // productImageList에 담기
                const productImageTemp = {
                    _id: productImageNo,
                    product_code: productCode,
                    orginalname: originalname,
                    filedata: filedata,
                    filetype: filetype,
                    priority: Number(j + 1)
                }

                // MONGODB에 저장
                collection = dbconn.db('id304').collection('lush_product_image');
                result = await collection.insertOne(productImageTemp);
            }

            // 상세 페이지의 설명을 저장하기 위한 변수 설정

            // 'SEQ_PRODUCT_DETAIL_NO'의 값을 가져오기 위한 DB연결
            collection = dbconn.db('id304').collection('seq_lush_product_detail');

            // _id의 값이 'SEQ_PRODUCT_TYPE_IMAGE_NO'인 항목을 찾고 값을 1 증가
            result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_DETAIL_NO' }, { $inc: { seq: 1 } });

            // 타입 이미지 데이터 변환
            const productDetailNo = result.value.seq;

            const ingredient = await driver.findElements(By.css('div.ingredients-text > span.value'));
            const ingredientData = {
                _id: productDetailNo,
                product_code: productCode,
                main_ingredient: await ingredient[0].getText(),
                all_ingredient: await ingredient[1].getText()
            }

            collection = dbconn.db('id304').collection('lush_product_detail');
            result = await collection.insertOne(ingredientData);

            // 상세 페이지의 이미지를 저장하기 위한 변수 설정
            const detailTemp = await driver.findElements(By.xpath('//*[@id="wrap"]/div/section[5]/div/div[2]/div'));

            for (let j = 0; j < detailTemp.length; j++) {
                // 'SEQ_PRODUCT_TYPE_IMAGE_NO'의 값을 가져오기 위한 DB연결
                collection = dbconn.db('id304').collection('seq_lush_product_detail_image');

                // _id의 값이 'SEQ_PRODUcT_TYPE_IMAGE_NO'인 항목을 찾고 값을 1 증가
                result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_DETAIL_IMAGE_NO' }, { $inc: { seq: 1 } });

                // 타입 이미지 데이터 변환
                const productDetailImageNo = result.value.seq;

                const productDetailImage = await detailTemp[j].findElement(By.css('div.item-thumb > img'));
                const productDetailTitle = await detailTemp[j].findElement(By.css('dl.item-text > dt.text-title'));
                const productDetailDesc = await detailTemp[j].findElement(By.css('dl.item-text > dd.text-desc'));

                const productDetailUrl = await productDetailImage.getAttribute('src');
                const response = await axios.get(productDetailUrl, { responseType: 'arraybuffer' });
                const originalname = response.request.path;
                const filetype = response.headers["content-type"];
                const filedata = Buffer.from(response.data, 'utf-8');

                const productDetailImageData = {
                    _id: productDetailImageNo,
                    product_detail_no: productDetailNo,
                    name: await productDetailTitle.getText(),
                    desc: await productDetailDesc.getText(),
                    originalname: originalname,
                    filedata: filedata,
                    filetype: filetype,
                    priority: Number(j + 1)
                }

                collection = dbconn.db('id304').collection('lush_product_detail_image');
                result = await collection.insertOne(productDetailImageData);
            }

            for (let k = 0; k < productTypeList[i].length; k++) {
                // 'SEQ_PRODUCT_TYPE_IMAGE_NO'의 값을 가져오기 위한 DB연결
                collection = dbconn.db('id304').collection('seq_lush_product_type_image');

                // _id의 값이 'SEQ_PRODUcT_TYPE_IMAGE_NO'인 항목을 찾고 값을 1 증가
                result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_TYPE_IMAGE_NO' }, { $inc: { seq: 1 } });

                // 타입 이미지 데이터 변환
                const productTypeImageNo = result.value.seq;

                // productTypeList에 담기
                const productTypeImageTemp = {
                    _id: productTypeImageNo,
                    product_code: productCode,
                    orginalname: productTypeList[i][k].originalname,
                    filedata: productTypeList[i][k].filedata,
                    filetype: productTypeList[i][k].filetype,
                    priority: Number(k + 1)
                }

                // MONGODB에 저장
                collection = dbconn.db('id304').collection('lush_product_type_image');
                result = await collection.insertOne(productTypeImageTemp);
            }

            // 뒤로가기 버튼 클릭
            driver.navigate().back();

            // 페이지 로딩을 위해 2초간 대기
            try {
                await driver.wait(() => { return false; }, 2000);
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        // 브라우저 종료
        driver.quit();
        return 0;
    }
})();