// 파일명: lush_shipping.js
var express = require('express');
var router = express.Router();

// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 로그인 토큰 발행
const randToken = require('rand-token');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretkey').secretKey;
const options = require('../config/secretkey').options;
const checkToken = require('../config/auth').checkToken;

// 배송정보등록(배송지번호, 회원아이디, 배송지이름, 받으실분, 받으실곳(우편번호, 배송주소), 휴대폰번호)
// POST > localhost:3000/shipping/register
router.POST('/register', checkToken, async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_shipping');

        // 2. SEQ_SHIPPING_NO를 받아오기
        var query = { _id: 'SEQ_SHIPPING_NO' };
        var updateData = { $inc: { seq: 1 } };
        var result = await collection.findOneAndUpdate(query, updateData);

        // 3. 전달 값 받기
        const _id = Number(result.value.seq);         // 배송번호
        const member_id = req.idx;                    // 아이디
        const address_name = req.body.address_name;   // 배송지이름
        const customer_name = req.body.customer_name; // 받으실분
        const phone = req.body.phone;                 // 휴대폰번호
        const zip_code = req.body.zip_code;           // 우편번호
        const shipping_address = req.body.shipping_address  // 배송주소

        // 4. DB변경
        collection = dbconn.db('id304').collection('lush_shipping');

        // 5. 전달할 데이터
        const shippingData = {
            _id: _id,
            member_id: member_id,
            address_name: address_name,
            customer_name: customer_name,
            phone: phone,
            zip_code: zip_code,
            shipping_address: shipping_address
        }

        // 6. DB에 shippingData 저장
        result = await collection.insertOne(shippingData);

        // 7. DB닫기
        dbconn.close();

        // 8. 결과 값 리턴
        if (result.insertedId === shippingData._id) {
            return res.send({ ret: 1, data: `배송지정보 등록을 성공했습니다.` });
        }
        return res.send({ ret: 0, data: '배송지정보 등록을 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 배송정보수정(이름, 이메일, 휴대폰번호, 우편번호, 배송주소)
// PUT > localhost:3000/shipping/update
router.put('/update', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const _id = req.body._id                      // 배송번호
        const member_id = req.idx;                    // 아이디
        const address_name = req.body.address_name;   // 배송지이름
        const customer_name = req.body.customer_name; // 받으실분
        const phone = req.body.phone;                 // 휴대폰번호
        const zip_code = req.body.zip_code;           // 우편번호
        const shipping_address = req.body.shipping_address  // 배송주소

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_shipping');

        // 3. DB에 변경할 정보 업데이트
        const query = { _id: _id, member_id: member_id };
        const changeData = { $set: { address_name: address_name, customer_name: customer_name, phone: phone, zip_code: zip_code, shipping_address: shipping_address } };
        const result = await collection.updateOne(query, changeData);

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: `배송지정보 수정을 성공하였습니다.` });
        }
        return res.send({ ret: 0, data: '배송지정보 수정을 실패하였습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});


// 배송정보삭제
// DELETE > localhost:3000/shipping/delete
router.delete('/delete', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const _id = req.body._id;
        const member_id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_shipping');

        // 3. DB삭제
        const query = { _id: _id, member_id: member_id };
        const result = await collection.deleteOne(query);

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        if(result.deletedCount === 1){
            return res.send({ret: 1, data: '배송지정보 삭제를 성공하였습니다.'});
        }
        return res.send({ret: 0, data: '배송지정보 삭제를 실패하였습니다.'});
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 배송정보목록조회
// GET > localhost:3000/shipping/list
router.get('/list', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const member_id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_shipping');

        // 3. DB조회
        const query = { member_id: member_id };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});


// 배송정보한개조회
// GET > localhost:3000/shipping/address?no=배송번호
router.get('/address', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const _id = Number(req.query.no); // 배송번호

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_shipping');

        // 3. DB조회
        const query = { _id: _id };
        const result = await collection.findOne(query);

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 배송목록개수조회 => 3개이상 등록 방지기능
// GET > localhost:3000/shipping/count
router.get('/count', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const member_id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_shipping');

        // 3. DB조회
        const query = { member_id: member_id };
        const result = await collection.countDocuments(query);

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;