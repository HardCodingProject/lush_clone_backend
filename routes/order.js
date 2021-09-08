// 파일명: order.js
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

// 주문목록조회(테스트 중)
// GET > localhost:3000/order/list
router.get('/list', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        /* 
        주문번호
        회원아이디 => token값으로 받을 예정
        회원이름
        회원이메일
        회원휴대폰번호
        회원주소
        주문날짜 => new Date()
         */

        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lushOrder');

        // 2. 주문번호 가져오기
        const query = { _id: "SEQ_ORDER_NO" };
        const seqResult = await collection.findOneAndUpdate(query, { $inc: { seq: 1 } });

        // 2-1. 고민 => 토큰 값을 받아 회원 정보를 조회해 올 것인지.. 아니면 직접 데이터를 적어 넣을 것 인지...
        const orderData = { 
            _id: seqResult.value.seq, // 주문번호
            orderId: req.idx, // 로그인아이디
            orderName: req.body.name, // 이름
            orderEmail: req.body.email, // 이메일
            orderPhone: req.body.phone, // 휴대폰번호
            orderAddr: req.body.address, // 주소
            regdate: new Date() // 주문일자
        }

        console.log(orderData);
        res.send({ret: 1, data: orderData});

        // // 2. DB연결
        // const dbconn = await mongoClient.connect(mongourl);
        // const collection = dbconn.db('id304').collection('lushOrder');
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 장바구니(테스트 중) => DB에 저장 후 아이템을 담은 리스트를 mongoDB에 저장
// GET > localhost:3000/order/cart
router.get('/cart', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        /* 
        주문번호
        회원아이디 => token값으로 받을 예정
        회원이름
        회원이메일
        회원휴대폰번호
        회원주소
        주문날짜 => new Date()
         */

        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lushOrder');

        // 2. 주문번호 가져오기
        const query = { _id: "SEQ_ORDER_NO" };
        const seqResult = await collection.findOneAndUpdate(query, { $inc: { seq: 1 } });

        // 2-1. 고민 => 토큰 값을 받아 회원 정보를 조회해 올 것인지.. 아니면 직접 데이터를 적어 넣을 것 인지...
        const orderData = { 
            _id: seqResult.value.seq, // 주문번호
            orderId: req.idx, // 로그인아이디
            orderName: req.body.name, // 이름
            orderEmail: req.body.email, // 이메일
            orderPhone: req.body.phone, // 휴대폰번호
            orderAddr: req.body.address, // 주소
            regdate: new Date() // 주문일자
        }

        console.log(orderData);
        res.send({ret: 1, data: orderData});

        // // 2. DB연결
        // const dbconn = await mongoClient.connect(mongourl);
        // const collection = dbconn.db('id304').collection('lushOrder');
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

module.exports = router;
