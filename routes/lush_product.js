// 파일명: lush_product.js
var express = require('express');
var router = express.Router();

// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 라이브러리
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 로그인 토큰 발행
const checkToken = require('../config/auth').checkToken;

// 물품후기 목록 개수 조회(테스트 완료) => 페이지네이션을 위한 기능
// GET > localhost:3000/product/review/count
router.get('/review/count', async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 2. 전체 후기 개수 검색
        const query = {};
        const result = await collection.countDocuments(query);

        // 3. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 목록 조회(테스트 완료) => 후기는 10개씩 페이지네이션
// GET > localhost:3000/product/review/list?page=페이지
router.get('/review/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const page = Number(req.query.page);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 입력 값을 포함하여 검색
        const query = {};
        const result = await collection.find(query, { projection: { originalname: 0, filedata: 0, filetype: 0 } }).sort({ _id: 1 }).skip((page - 1) * 10).limit(10).toArray();

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 자신이 작성한 물품후기 조회(테스트 완료)
// GET > localhost:3000/product/review/list-one
router.get('/review/list-one', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const member_id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 입력 값을 포함하여 검색
        const query = { member_id: member_id };
        const result = await collection.findOne(query, { projection: { originalname: 0, filedata: 0, filetype: 0 } });

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 등록(테스트 완료)
// POST > localhost:3000/product/review/register
router.post('/review/register', checkToken, upload.array('image'), async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const member_id = req.idx;
        const product_code = Number(req.body.product_code);
        const review_content = req.body.review_content;
        const review_rating = Number(req.body.review_rating);

        // 2. 이름을 받아오기 위한 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        let collection = dbconn.db('id304').collection('lush_member');

        // 3. member_id의 값을 조건으로 사용하여 댓글 작성자의 이름 받아오기
        const query = { _id: member_id };
        let result = await collection.findOne(query, { projection: { name: 1 } });

        // 4. 사용자의 이름을 변수에 저장
        const member_name = result.name;

        // 5. DB변경 후 물품후기 번호 받아오기
        collection = dbconn.db('id304').collection('seq_lush_product_review');
        result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_REVIEW_NO' }, { $inc: { seq: 1 } });

        // 6. 물품후기 번호를 변수에 저장하기
        const product_review_no = result.value.seq;

        // 7. DB변경
        collection = dbconn.db('id304').collection('lush_product_review');

        // 8. DB에 넣을 데이터 가공
        const product_review = {
            _id    : product_review_no,
            member_id    : member_id,
            product_code : product_code,
            content      : review_content,
            rating       : review_rating,
            originalname : req.files[0].originalname,
            filedata     : req.files[0].buffer,
            filetype     : req.files[0].mimetype,
            regdate      : new Date()
        }

        // 9. product_review를 DB에 넣기
        result = await collection.insertOne(product_review);

        // 10. 결과 값 반환
        if (result.insertedId === product_review._id) {
            return res.send({ ret: 1, data: `${product_review.member_id}님의 후기 작성이 성공했습니다.` });
        }
        res.send({ ret: 0, data: '후기 작성 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 수정(테스트 완료)
// PUT > localhost:3000/product/review/update
router.put('/review/update', checkToken, upload.array('image'), async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_review_no = Number(req.body.review_no);
        const member_id = req.idx;
        const review_content = req.body.review_content;
        const review_rating = Number(req.body.review_rating);

        // 2. DB변경
        const dbconn = await mongoClient.connect(mongourl);
        collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 조건설정
        const query = { _id: product_review_no , member_id: member_id };
        console.log(req.files.length);

        // 이미지가 첨부되어있지 않을 경우
        if(req.files.length === 0){
            // 변경할 데이터
            const changeData = {
                $set: {
                    content: review_content,
                    rating: review_rating
                }
            }

            // 4. 물품 후기 내용을 업데이트하기
            const result = await collection.updateOne(query, changeData);
            
            // 5. 결과 값 반환
            if(result.matchedCount === 1){
                return res.send({ ret: 1, data: `${result.matchedCount}개의 후기가 수정되었습니다.` });
            }
            res.send({ret: 0, data: '후기작성을 실패했습니다.'});
        }
        // 이미지도 함께 수정할 경우
        else {
            // 변경할 데이터
            const changeData = {
                $set: {
                    content: review_content,
                    rating: review_rating,
                    originalname: req.files[0].originalname,
                    filedata: req.files[0].buffer,
                    filetype: req.files[0].mimetype,
                }
            }

            // 4. 물품 후기 내용을 업데이트하기
            const result = await collection.updateOne(query, changeData);

            // 5. 결과 값 반환
            if(result.matchedCount === 1){
                return res.send({ ret: 1, data: `${result.matchedCount}개의 후기가 수정되었습니다.` });
            }
            res.send({ret: 0, data: '후기작성을 실패했습니다.'});
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 삭제(테스트 완료)
// PUT > localhost:3000/product/review/delete
router.delete('/review/delete', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_review_no = Number(req.body.review_no);
        const member_id = req.idx;

        // 2. DB변경
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 조건설정
        const query = { _id: product_review_no , member_id: member_id };

        // 4. 조건에 맞는 데이터 DB에서 삭제
        const result = await collection.deleteOne(query);

        // 5. 결과 값 반환
        if (result.deletedCount === 1) {
            return res.send({ ret: 1, data: `${result.deletedCount}개의 후기가 삭제되었습니다.` });
        }
        res.send({ ret: 0, data: '후기삭제를 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;