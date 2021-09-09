// 파일명: admin.js
var express = require('express');
var router = express.Router();

// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 모듈
const fs = require('fs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 크롤링 데이터 일괄 추가(테스트 중)
// POST > localhost:3000/admin/product/crawling
router.post('/product/crawling', async function (req, res, next) {
    try {
        // 2. 크롤링된 JSON파일 불러오기
        const dataBuffer = fs.readFileSync('./crawling/lush-product.json');
        const dataJSON = dataBuffer.toString();
        const data = JSON.parse(dataJSON);
        console.log(data);
        res.send({ret: 1, data: data});
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});


// 물품 일괄 추가(테스트 완료)
// POST > localhost:3000/admin/product/register
router.post('/product/register', upload.array('image'), async function (req, res, next) {
    try {
        // 1. 물품코드 가져오기
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lushProduct');

        var arr = [];
        if (Array.isArray(req.body.name)) { // 등록 물품 개수가 2개 이상인 경우
            for (let i = 0; i < req.body.name.length; i++) {
                const result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_NO' }, { $inc: { seq: 1 } });
                arr.push({
                    _id: result.value.seq,                 // 물품코드
                    name: req.body.name[i],                // 물품명
                    price: Number(req.body.price[i]),      // 물품가격
                    weight: Number(req.body.weight[i]),    // 물품무게
                    quantity: Number(req.body.quantity[i]),// 물품개수
                    // 메인 물품 이미지 1개, 서브 물품 이미지 3개 => 수정할 것 => 이미지가 넘어오지 않는다면 default_img 처리할 것
                    filename: req.files[i].originalname,
                    filetype: req.files[i].mimetype,
                    filedata: req.files[i].buffer,
                    tag: req.body.tag[i]                    // 물품태그
                });
            }
        } else { // 등록 물품 개수가 1개일 경우
            const result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_NO' }, { $inc: { seq: 1 } });
            arr.push({
                _id: result.value.seq,               // 물품코드
                name: req.body.name,                 // 물품명
                price: Number(req.body.price),       // 물품가격
                weight: Number(req.body.weight),     // 물품무게
                quantity: Number(req.body.quantity), // 물품개수
                // 메인 물품 이미지 1개, 서브 물품 이미지 3개 => 수정할 것
                filename: req.files[0].originalname,
                filetype: req.files[0].mimetype,
                filedata: req.files[0].buffer,
                tag: req.body.tag                    // 물품태그
            });
        }

        collection = dbconn.db('id304').collection('lushProduct');
        const result = await collection.insertMany(arr);

        if (result.insertedCount === arr.length) {
            return res.send({ ret: 1, data: `${arr.length}개의 물품을 등록했습니다.` });
        }
        res.send({ ret: 0, data: '물품을 등록하지 못했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 일괄 삭제(테스트 완료)
// DELETE > localhost:3000/admin/product/delete
router.delete('/product/delete', async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lushProduct');

        // 2. 삭제할 물품이 2개이상인지 판별하여 쿼리문을 작성
        const code = req.body.code;
        let query = { _id: { $in: [Number(code)] } };
        if (Array.isArray(code)) {
            const numArray = code.map(Number);
            query = { _id: { $in: numArray } };
        }

        // 3. DB삭제
        const result = await collection.deleteMany(query);

        // 4. 결과 값 반환
        if (result.deletedCount > 0) {
            return res.send({ ret: 1, data: `${result.deletedCount}개 물품을 삭제하였습니다.` });
        }
        return res.send({ ret: 0, data: '물품 삭제를 실패하였습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 일괄 수정(테스트완료)
// PUT > localhost:3000/admin/product/update
router.put('/product/update', async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lushProduct');
        const code = req.body.code;
        var cnt = 0;


        // 2. DB수정
        if (Array.isArray(code)) {
            for (let i = 0; i < code.length; i++) {
                const query = { _id: Number(code[i]) };
                const changeData = {
                    $set: {
                        name: req.body.name[i],                 // 물품명
                        price: Number(req.body.price[i]),       // 물품가격
                        weight: Number(req.body.weight[i]),     // 물품무게
                        quantity: Number(req.body.quantity[i]), // 물품개수
                        tag: req.body.tag[i]                    // 물품태그
                    }
                };
                const result = await collection.updateOne(query, changeData);
                cnt += result.matchedCount;
            }

            // 3. 결과 값 리턴
            if (cnt === req.body.code.length) {
                return res.send({ ret: 1, data: `${cnt}개의 물품을 수정했습니다.` });
            }
            res.send('물품 수정을 실패하였습니다.');
        } else {
            const query = { _id: Number(code) };
            const changeData = {
                $set: {
                    name: req.body.name,                 // 물품명
                    price: Number(req.body.price),       // 물품가격
                    weight: Number(req.body.weight),     // 물품무게
                    quantity: Number(req.body.quantity), // 물품개수
                    tag: req.body.tag                    // 물품태그
                }
            };
            const result = await collection.updateOne(query, changeData);

            // 3. 결과 값 리턴
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: `${result.matchedCount}개의 물품을 수정했습니다.` });
            }
            res.send('물품 수정을 실패하였습니다.');
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 목록 조회(테스트완료)
// GET > localhost:3000/admin/product/list?page=페이지&search=검색명
router.get('/product/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const page = Number(req.query.page);
        const search = req.query.search;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lushProduct');

        // 3. 입력 값을 포함하여 검색
        const query = { name: new RegExp(search, 'i') };
        const result = await collection.find(query, { projection: { filedata: 0, filename: 0, filetype: 0 } }).sort({ _id: 1 }).skip((page - 1) * 16).limit(16).toArray();

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 한 개 조회(테스트 완료)
// GET > localhost:3000/admin/product?code=물품코드
router.get('/product', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const code = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lushProduct');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: code};
        const result = await collection.findOne(query, {projection: {filedata: 0, filename: 0, filetype: 0}});

        console.log(result);

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 이미지 표시(테스트완료)
// GET > localhost:3000/admin/product/image?code=물품코드
router.get('/product/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const code = req.query.code;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lushProduct');

        // 3. 조회 조건
        const query = { _id: Number(code) };
        const result = await collection.findOne(query, { projection: { filedata: 1, filetype: 1 } });

        // 4. 이미지로 전송
        console.log(result.filetype);
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;
