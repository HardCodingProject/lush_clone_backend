const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder()
        .forBrowser('firefox')
        .build();
    try {
        // 러쉬 홈페이지 실행
        await driver.get('https://www.lush.co.kr/goods/goods_list.php?cateCd=001007');

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
        for(let i = 0; i < 20; i++){
            const productTypeImage = await productType[i].findElements(By.css('a > img'));

            const tempData = new Array();
            for(let j = 0; j < productTypeImage.length; j++){
                const obj = {
                    productTypeImage: await productTypeImage[j].getAttribute('src'),
                    productTypeText: await productTypeImage[j].getAttribute('title')
                }
                tempData.push(obj);
                //console.log(await productTypeImage[j].getAttribute('src'));
                //console.log(await productTypeImage[j].getAttribute('title'));
            }
            productTypeList.push(tempData);
            console.log(productTypeList);
        }

        // MONGODB에 저장하기 위한 리스트 객체 생성
        const productList = new Array();

        // URL을 크롤링한 개수만큼 반복문을 수행한다.
        for (let i = 0; i < 20; i++) {
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

                // List에 저장하기
                productImageList.push(productImage);
            }

            // 상세 페이지의 데이터를 저장하기 위한 변수를 설정한다.
            const productName = await driver.findElement(By.css('div.tit > h2'));
            const productTag = await driver.findElement(By.css('div.hashtag'));
            const productPrice = await driver.findElement(By.css('li.price > div > strong'));
            const productWeight = await driver.findElement(By.xpath('//*[@id="frmView"]/div/div/div[3]/ul/li[2]/div/span'));

            // PRODUCT DATA
            const productData = {
                productType: productTypeList[i][0],
                productImage: productImageList,
                productName: await productName.getText(),
                productTag: await productTag.getText(),
                productPrice: await productPrice.getText(),
                productWeight: await productWeight.getText(),
            }

            productList.push(productData);

            // 뒤로가기 버튼 클릭
            driver.navigate().back();

            // 페이지 로딩을 위해 4초간 대기
            try {
                await driver.wait(() => { return false; }, 2000);
            } catch (error) {
                console.error(error);
            }
        }
        // MONGO DB연결
        console.log(productList);
    }
    finally {
        // 종료한다.
        driver.quit();
    }
})();