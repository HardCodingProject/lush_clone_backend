const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const log = console.log;

const getHtml = async () => {
    try {
        const response = await axios.get("https://www.lush.co.kr/goods/goods_list.php?cateCd=001013");
        return response;
    } catch (error) {
        console.error(error);
    }
};

getHtml().then(html => {
        let ulList = [];
        const $ = cheerio.load(html.data);
        const $bodyList = $("div ul").children("li");

        $bodyList.each(function (i, elem) {
            ulList[i] = {
                productImage: $(this).find('span.prdimg img').attr('data-original'),
                productImageAlt: $(this).find('span.prdimg img').attr('alt'),
                productType : $(this).find('span.hot img').attr('src'),
                productName : $(this).find('span.prdName').text(),
                productTag  : $(this).find('span.shotdesc').text(),
                productPrice: $(this).find('span.cost strong').text()
            };
        });
        const data = ulList.filter(n => n.productName);
        console.log(data);
        fs.writeFileSync("lush-product.json", JSON.stringify(data));
        return data;
    })
    .then(response => log(response));