// 파일명: cart.js
var express = require('express');
var router = express.Router();

// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 모듈
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 로그인 토큰 
const checkToken = require('../config/auth').checkToken;

// 장바구니 물품 등록(테스트 완료)
// POST > localhost:3000/cart/add
router.post('/add', checkToken, async function (req, res, next) {
    try {
        // 1. 로그인 체크
        if (typeof (req.idx) === 'undefined') {
            alert('로그인 후 이용가능합니다.');
            return router.$push('/member/login');
        }

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lushCart');

        // 3. 장바구니 물품 배열 선언
        const items = new Array(); // 물품코드 리스트

        // 4. 로그인 한 아이디를 조건으로 장바구니 목록 조회, 없다면 추가
        var query = { memberId: req.idx };
        var result = await collection.findOne(query);

        // 4-1. 장바구니를 처음 이용하는 경우
        if (result === null) {
            // DB변경 => 시퀀스 번호 입력
            collection = dbconn.db('id304').collection('seq_lushCart');

            // 조건 설정
            query = { _id: "SEQ_CART_NO" };
            const seqResult = await collection.findOneAndUpdate(query, { $inc: { seq: 1 } });

            // 물품 리스트에 물품 넣기
            const item = {
                productCode: req.body.productCode,
                count: 1
            }

            items.push(item);

            // 추가할 데이터
            const data = {
                _id: seqResult.value.seq, // 장바구니 번호
                memberId: req.idx, // 회원 아이디
                items: items // 물품 목록
            };

            collection = dbconn.db('id304').collection('lushCart');

            result = await collection.insertOne(data);

            if (result.insertedId === seqResult.value.seq) {
                return res.send({ ret: 1, data: '장바구니에 물건이 들어갔습니다.' });
            }
            res.send({ ret: 0, data: '장바구니에 물건을 등록하지 못했습니다.' });
        }
        // 4-2. 장바구니를 두 번쨰 이용하는 경우
        else {
            if (result.items.length === 0) {
                const item = {
                    productCode: req.body.productCode,
                    count: 1
                }
                items.push(item);

                // 5. 장바구니 업데이트
                var collection = dbconn.db('id304').collection('lushCart');
                const changeData = { $set: { items: items } };
                result = await collection.updateOne(query, changeData);

                // 6. 결과 값 리턴
                if (result.modifiedCount === 1) {
                    return res.send({ ret: 1, data: '장바구니의 물건이 업데이트 되었습니다.' });
                }
                res.send({ ret: 0, data: '장바구니 업데이트에 실패했습니다.' });
            } else {
                // 기존 물품 추가
                for (let i = 0; i < result.items.length; i++) {
                    items.push(result.items[i]);
                }

                // 새로운 물품 추가
                let index = 0;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].productCode === req.body.productCode) {
                        index = i;
                    }
                }

                if (items[index].productCode === req.body.productCode) {
                    items[index].count++;
                } else {
                    const item = {
                        productCode: req.body.productCode,
                        count: 1
                    }
                    items.push(item);
                }

                // 5. 장바구니 업데이트
                var collection = dbconn.db('id304').collection('lushCart');
                const changeData = { $set: { items: items } };
                result = await collection.updateOne(query, changeData);

                // 6. 결과 값 리턴
                if (result.modifiedCount === 1) {
                    return res.send({ ret: 1, data: '장바구니의 물건이 업데이트 되었습니다.' });
                }
                res.send({ ret: 0, data: '장바구니 업데이트에 실패했습니다.' });
            }
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 장바구니 목록 조회(테스트 완료)
// GET > localhost:3000/cart/list
router.get('/list', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const memberId = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lushCart');

        // 3. 장바구니 목록 가져오기
        query = { memberId: memberId };
        const cartListResult = await collection.findOne(query);

        // 4. 결과 값 리턴
        res.send({ ret: 1, data: cartListResult });
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 장바구니 아이템 삭제(테스트 완료)
// PUT > localhost:3000/cart/delete
router.put('/delete', checkToken, async function (req, res, next) {
    // 1. 전달 값 받기
    const productCode = req.body.productCode;
    const memberId = req.idx;

    // 2. DB연결
    const dbconn = await mongoClient.connect(mongourl);
    const collection = dbconn.db('id304').collection('lushCart');

    // 3. 물품 삭제
    const query = { memberId: memberId };
    var result = await collection.findOne(query);

    var items = new Array();

    // 3-1. 물품이 1개인 경우
    if (typeof (productCode) === 'string') {
        for (let i = 0; i < result.items.length; i++) {
            if (result.items[i].productCode === productCode) {
                flag = false;
                break;
            }
            items.push(result.items[i]);
        }
    }
    // 3-2. 물품이 2개 이상인 경우
    else {
        for (let i = 0; i < result.items.length; i++) {
            let flag = true;
            for (let j = 0; j < productCode.length; j++) {
                if (result.items[i].productCode === productCode[j]) {
                    flag = false;
                    break;
                }
            }
            if (flag === true) {
                items.push(result.items[i]);
            }
        }
    }
    const changeData = { $set: { items: items } };
    result = await collection.updateOne(query, changeData);

    // 4. 결과 값 리턴
    if (result.matchedCount === 1) {
        return res.send({ ret: 1, data: `체크한 항목의 물품이 제거되었습니다.` });
    }
    res.send({ ret: 0, data: '물품삭제가 실패했습니다.' });
});

module.exports = router;