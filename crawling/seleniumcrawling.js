const { Builder, By, Key, until } = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder()
        .forBrowser('firefox')
        .build();
    try {
        // 러쉬 홈페이지 실행
        await driver.get('https://www.lush.co.kr/goods/goods_list.php?cateCd=001013');

        // Javascript를 실행하여 UserAgent를 확인한다.
        let userAgent = await driver.executeScript("return navigator.userAgent;")
        console.log('[UserAgent]', userAgent);

        // total_tit라는 클래스 명을 가진 element들을 받아온다.
        let productImage = await driver.findElements(By.css('span.prdimg img'));
        let productImageAlt = await driver.findElements(By.css('span.prdimg img'));
        let productName = await driver.findElements(By.css('span.prdName'));
        let productTag = await driver.findElements(By.css('span.shotdesc'));
        let productPrice = await driver.findElements(By.css('span.cost strong'));
        let pagination = await driver.findElements(By.css('ul.pagination li a'));
        console.log('[productName.length]', productName.length)

        // patch해서 가져오면 된다.
        const productList = new Array();
        for (var i = 0; i < productName.length; i++) {
            const productData = {
                productImage: await productImage[i].getAttribute('src'),
                productImageAlt: await productImageAlt[i].getAttribute('alt'),
                productName: await productName[i].getText(),
                productTag: await productTag[i].getText(),
                productPrice: await productPrice[i].getText(),
            }
            productList.push(productData);
            console.log(await pagination[i].getAttribute('href'));
        }
        console.log(productList);

        if (productName.length > 0){
            await pagination[1].click();
        }

        // 4초를 기다린다.
        try {
            await driver.wait(() => { return false; }, 4000);
        } catch (err) {

        }
    }
    finally {
        // 종료한다.
        driver.quit();
    }
})();