// 파일명: lush_order.js
var express = require('express');
var router = express.Router();

// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 라이브러리
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 로그인 토큰 
const checkToken = require('../config/auth').checkToken;

// 상세 물품 페이지에서 받아올 수 있는 항목은 아이디, 물품코드, 물품개수가 있다.

// 장바구니에 물품추가 => 해결
// PUT > localhost:3000/order/addlist
router.put('/addlist', checkToken, async function (req, res, next) {
    try {
        //전달되는 값
        const idx = req.idx; // 회원아이디
        const product_code = Number(req.body.product_code);   // 물품코드
        const product_count = Number(req.body.product_count); // 물품수량
        const order = false; // 장바구니/주문

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        collection = dbconn.db("id304").collection("lush_addlist");

        var query = { member_id: idx, product_code: product_code };
        var result = await collection.findOne(query);

        // 해당 번호의 물품이 존재하지 않을경우,
        if (result === null) {
            //저장할 내용 > 회원아이디, 물품 코드, 물품 개수, 주문상태 받아오기
            const orderData = {
                member_id: idx,
                product_code: product_code,
                product_count: product_count,
                order: order,
            }
            // order값은 주문이 완료된것인지 진행중인것인지를 판별하기 위함
            // order값이 true 일경우 이미 완료된 주문

            // DB에 저장
            result = await collection.insertOne(orderData);

            // DB닫기
            dbconn.close();

            // 결과값 반환
            if (result.acknowledged === true) {
                return res.send({ ret: 1, data: '물품 추가를 성공했습니다.' });
            }
            res.send({ ret: 0, data: `물품 추가를 실패했습니다.` });
        }
        // 기존에 등록된 동일한 물품이 있을경우
        else {
            const cur_count = result.product_count;
            const changeData = { $set: { product_count: (cur_count + product_count) } };

            // DB에 수정
            result = await collection.updateOne(query, changeData);

            console.log(result);

            // DB닫기
            dbconn.close();

            // 결과값 반환
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: '물품 추가를 성공했습니다.' });
            }
            res.send({ ret: 0, data: `물품 추가를 실패했습니다.` });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 장바구니 물품 목록 => 고민
//http://127.0.0.1:3000/order/orderlist
router.get('/orderlist', checkToken, async function (req, res, next) {
    try {
        // 전달 값 받기
        const member_id = req.idx;

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db("id304").collection("lush_addlist");

        //주문내역 불러오는 조건
        //아이디동일, order값이 false일 경우
        const query = { member_id: member_id, order: false };
        const result = await collection.find(query).sort({product_code : 1}).toArray();

        console.log(result);

        // 결과 값 반환
        res.send({ ret: 1, data: result })
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});


// 물품 수량 1 감소 버튼
// PUT > localhost:3000/order/cnt-minus
router.put('/cnt-minus', checkToken, async function (req, res, next) {
    try {
        //전달되는 값
        const idx = req.idx; // 회원아이디
        const product_code = Number(req.body.product_code);   // 물품코드
        const product_count = Number(req.body.product_count); // 물품수량
        const order = false; // 장바구니/주문

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        collection = dbconn.db("id304").collection("lush_addlist");

        var query = { member_id: idx, product_code: product_code };
        var result = await collection.findOne(query);

        const cur_count = result.product_count;
        const changeData = { $set: { product_count: (cur_count - 1) } };

        // DB에 수정
        result = await collection.updateOne(query, changeData);

        // DB닫기
        dbconn.close();

        // 결과값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: '물품 수량 1 감소.' });
        }
        res.send({ ret: 0, data: '물품 수량 감소 실패.' });
    }
    catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 물품 수량 1 증가
// PUT > localhost:3000/order/cnt-plus
router.put('/cnt-plus', checkToken, async function (req, res, next) {
    try {
        //전달되는 값
        const idx = req.idx; // 회원아이디
        const product_code = Number(req.body.product_code);   // 물품코드
        const product_count = Number(req.body.product_count); // 물품수량
        const order = false; // 장바구니/주문

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        collection = dbconn.db("id304").collection("lush_addlist");

        var query = { member_id: idx, product_code: product_code };
        var result = await collection.findOne(query);

        const cur_count = result.product_count;
        const changeData = { $set: { product_count: (cur_count + 1) } };

        // DB에 수정
        result = await collection.updateOne(query, changeData);

        // DB닫기
        dbconn.close();

        // 결과값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: '물품 수량 1 증가.' });
        }
        res.send({ ret: 0, data: '물품 수량 증가 실패.' });
    }
    catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

//최종주문하기
// put > localhost:3000/order/order
router.put('/order', checkToken, async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_order');

        // 2. 주문번호 가져오기
        var query = { _id: "SEQ_ORDER_NO" };
        const seqResult = await collection.findOneAndUpdate(query, { $inc: { seq: 1 } });

        const _id = Number(seqResult.value.seq);

        collection = dbconn.db('id304').collection('lush_addlist');

        const member_id = req.idx;

        query = { member_id: member_id, order: false };
        var result = await collection.countDocuments(query);

        //console.log(result);
        //주문 목록개수

        let count=0;

        for (let i = 0; i < result; i++) {
            const changeData = { $set: { address_number: 1, order_no: _id, order: true, regdate: new Date() } };
            const changeResult = await collection.updateOne(query, changeData);

            if (changeResult.matchedCount === 1) {
                count++;
            }
        }

        if (result === count) {
            res.send({ ret: 1, data: '주문 완료 되었습니다' });
            return;
        }
        res.send({ ret: 0, data: '주문 실패 했습니다.' });


    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});


//선택하여 주문 목록 물품삭제
//http://127.0.0.1:3000/order/deleteSelect
router.delete('/deleteSelect', checkToken, async function (req, res, next) {
    try {
        const chks = req.body.chks;
        const member_id = req.idx;
        //배열로 받아지는지 ??
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_addlist');
        
        if (typeof(chks) === 'String') {
            // 1. 조건1 chks === 문자로 올때
            const query = { product_code: Number(chks), member_id: member_id };
            const result = await collection.deleteOne(query);

            if (result.deletedCount === 1) {
                res.send({ ret: 1, data: '삭제 성공' });
                return;
            }
            res.send({ ret: 0, data: '삭제 실패' });
        } else {
            // 2. 조건2 chks > 1
            // 배열, 오브젝트로 올때
            let count = 0;

            for (let i = 0; i < chks.length; i++) {
                const query = { product_code: Number(chks[i]), member_id: member_id };
                const result = await collection.deleteOne(query);
                // deletedCount
                if (result.deletedCount === 1) {
                    count++;
                }
            }

            if (count === chks.length) {
                res.send({ ret: 1, data: '삭제 성공' });
                return;
            }
            res.send({ ret: 0, data: '삭제 실패' });
        }
    }
    catch (error) {
        console.error(error);
    }
});


// 과거 주문목록
// GET > localhost:3000/order/order1
router.get('/order1', checkToken, async function (req, res, next) {
    try {
        const member_id = req.idx;

        //db연동
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db("id304").collection("lush_addlist");

        //과거주문내역 불러오는 조건
        //아이디동일, order값이 true일 경우
        const query = { member_id: member_id, order: true };
        const result = await collection.find(query).sort({product_code : 1}).toArray();

        console.log(result);

        // 결과 값 반환
        res.send({ ret: 1, data: result })
    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});

// 주문 취소( 입금대기 )
// DELETE > localhost:3000/order/ordercancle
router.delete('/ordercancle', checkToken, async function (req, res, next) {
    try {
        const order_no = Number(req.body.order_no);
        const member_id = req.idx;

        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db("id304").collection("lush_addlist");

        const query = {order_no : order_no, member_id : member_id};

        const result = await collection.deleteMany(query);

        console.log(result);

        if(result.acknowledged ===true){
            res.send({ret:1, data:'주문 취소 되었습니다'});
            return;
        }
        res.send({ret:0, data:'주문을 취소하지 못했습니다'});


    } catch (error) {
        console.error(error);
        res.send({ ret: 1, data: error });
    }
});



module.exports = router;