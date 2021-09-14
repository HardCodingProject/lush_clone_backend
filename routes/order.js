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

// 주문추가
// GET > localhost:3000/order/addlist
router.get('/addlist', checkToken, async function (req, res, next) {
    try {
        //전달되는 값
        const idx = req.idx;            //이메일 토큰 확인후 전달되는 id값
        const code = req.body.code;     //물품코드
        const cnt = req.body.cnt;       //주문수량

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lushOrder');

        //seq넘버 1증가
        const query = { _id: "SEQ_ORDER_NO" };
        const SeqResult = await collection.findOneAndUpdate
        (query, { $inc: { seq: 1 } });

        //seq넘버, 주문번호 = orderNo
        const orderNo = SeqResult.value.seq;

        //저장할 컬렉션 변경
        collection = dbconn.db("id304").collection("lush_addlist");

        //저장할 내용 물품 코드, 입력된 개수 받아오기
        const object = {
            _id : idx, //아이디
            code : code,    // 품목코드
            cnt : Number(cnt),  //수량
            // regdate : new Date(),   //주문시간
        }
        //db에 저장
        const result = await collection.insertOne(object);
        dbconn.close();

        //flag true값 변환, seqNo를 1인 하나로 부여하기위함
        //동시주문시 seqNo 혼용 방지를 위함
        flag = true;

        if(result1.insertedId === orderNo){
            return res.send({ret:1,data:`주문번호 ${orderNo} 주문 추가 성공`});
        }
        res.send({ret:0, data:`주문 추가 실패`});
    
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

//주문 내역 불러오기, 주문하기 직전 주문추가했던 물품들 조회
//http://127.0.0.1:3000/order/orderlist
router.get('/orderlist', checkToken, async function(req,res,next) {
    try {
        
        const _id = req.idx;
        
        //db연동
        const dbconn = await mongoclient.connect(mongourl);
        var collection = dbconn.db("id304").collection("order7");

        //주문내역 불러오는 조건
        const query= {_id : _id};

        const result = await collection.find(query).toArray();

        //주문내역을 반복 , 물품에 대한정보 맞춰 찾아오기
        for(let i=0; i<result.length; i++){
            const query1 = { _id : Number(result[i].code)};
            const collection1 =  dbconn.db("id304").collection("item7");
            const result1 = await collection1.findOne(query1);


            result[i]['item_name'] = result1.name;
            result[i]['item_price'] = result1.price;

        }

        console.log(result);
    
        res.send({ret:1 , data:result})

    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
    
});

//선택하여 주문 취소
//http://127.0.0.1:3000/order/deleteSelect
router.delete('/deleteSelect',checkToken,async function(req, res, next) {
    try{
        //checkToken 이후 idx로 id값 들어온다 그걸 받아냄
        const _id = req.idx; 
        
        const arrNo = req.body.arrNo;  //주문번호

        const dbconn = await mongoclient.connect(mongourl);
        const collection = dbconn.db("id304").collection("order7");

        //id같을때 체크한 품목들 주문취소,삭제
        for(let i=0;i<arrNo.length;i++){
            const query = {_id: Number(arrNo[i]),_id:_id}
            const result = await collection.deleteOne(query);
            console.log(result);
        }
        res.send({ret:1,data:'주문취소 완료'});
    }
    catch(error){
        console.error(error);
    }
});

//최종주문하기
// GET > localhost:3000/order/order
router.get('/order', checkToken, async function (req, res, next) {
    try {
        //체크된 품목들의 품목코드, 개수 받아오기

        //DB연동


        //DB에 저장
       


       
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});



// 주문결정
// GET > localhost:3000/order/order
router.get('/order', checkToken, async function (req, res, next) {
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
