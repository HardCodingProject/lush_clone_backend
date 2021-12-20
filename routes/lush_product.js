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

// 물품 목록 조회 => 페이지네이션 어떻게 했는지 물어보기.
// GET > http://localhost:3000/product/list?page=페이지&categoryCode=카테고리코드
router.get('/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const page = Number(req.query.page);
        const category_code = Number(req.query.categoryCode);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { category_code: category_code };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();
        //const result = await collection.find(query).sort({ _id: 1 }).skip((page - 1) * 20).limit(20).toArray();

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 한 개 조회
// GET > http://localhost:3000/product?code=물품코드
router.get('/', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 3. product_code를 조건으로 설정하여 검색
        const query = { _id: product_code };
        const result = await collection.findOne(query);

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 이름 조회
// GET > http://localhost:3000/product/category?code=카테고리코드
router.get('/category', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const category_code = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. category_code를 조건으로 설정하여 검색
        const query = { _id: category_code };
        const result = await collection.findOne(query);

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 특정 물품 조회 (검색을 통한 제품 목록) => 페이지네이션 물어보기
// GET > http://localhost:3000/product/search/list?page=페이지&keyword=검색어
router.get('/search/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_name = req.query.keyword;
        console.log(req.query);


        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { name: new RegExp(product_name, 'i')};
        const result = await collection.find(query).toArray();
        console.log(result)

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 이미지 조회 => N회 반복
// GET > http://localhost:3000/product/image
router.get('/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.product_code);
        const priority = Number(req.body.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_image');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { product_code: product_code };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();
        // const result = await collection.find(query).sort({ _id: 1 }).skip((page - 1) * 20).limit(20).toArray();

        // 4. 결과 값 반환
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 이미지 개수 조회
// GET > http://localhost:3000/product/image/count
router.get('/image/count', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.body.product_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_image');

        // 3. 조건검색
        const query = { product_code: product_code, priority: 1 };
        const result = await collection.countDocuments(query);

        // 4. 결과 값 반환
        if (result > 0) {
            return res.send({ ret: 1, data: result });
        }
        res.send({ ret: 0, data: '일치하는 항목이 존재하지 않습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 타입 이미지 조회 => N번 반복 수행 
// GET > http://localhost:3000/product/type/image
router.get('/type/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.product_code);
        const priority = Number(req.query.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_type_image');

        // 3. 조건검색
        const query = { product_code: product_code, priority: priority };
        console.log(query);
        const result = await collection.findOne(query, { projection: { originalname: 1, filedata: 1, filetype: 1 } });

        // 4. 결과 값 반환
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 타입 이미지 개수 조회 
// GET > http://localhost:3000/product/type/image/count
router.get('/type/image/count', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.product_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_type_image');

        // 3. 조건검색
        const query = { product_code: product_code };
        const result = await collection.countDocuments(query);
        console.log(result);

        // 4. 결과 값 반환
        if (result > 0) {
            return res.send({ ret: 1, data: result });
        }
        res.send({ ret: 0, data: '일치하는 항목을 찾지 못했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 상세 조회
// GET > http://localhost:3000/product/detail
router.get('/detail', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product_detail');

        // 3. product_code를 조건으로 설정하여 검색
        const query = { product_code: product_code };
        const result = await collection.findOne(query);

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 상세 이미지 설명 조회
// GET > http://localhost:3000/product/detail/image/desc
router.get('/detail/image/desc', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_detail_no = Number(req.query.product_detail_no);
        const priority = Number(req.query.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product_detail_image');

        // 3. product_code를 조건으로 설정하여 검색
        const query = { product_detail_no: product_detail_no, priority: priority };
        console.log(query);
        const result = await collection.findOne(query);

        // 4. 결과 값 반환
        return res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 상세 이미지 조회 => N번 반복 수행 
// GET > http://localhost:3000/product/detail/image
router.get('/detail/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_detail_no = Number(req.query.product_detail_no);
        const priority = Number(req.query.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_detail_image');

        // 3. 조건검색
        const query = { product_detail_no: product_detail_no, priority: priority };
        const result = await collection.findOne(query, { projection: { originalname: 1, filedata: 1, filetype: 1 } });
        
        // 4. 결과 값 반환
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 상세 이미지 개수 조회 
// GET > http://localhost:3000/product/detail/image/count
router.get('/detail/image/count', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_detail_no = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_detail_image');

        // 3. 조건검색
        const query = { product_detail_no: product_detail_no };
        const result = await collection.count(query);

        // 4. 결과 값 반환
        if (result > 0) {
            return res.send({ ret: 1, data: result });
        }
        res.send({ ret: 0, data: '일치하는 항목을 찾지 못했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 목록 개수 조회
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

// 물품후기 조회 => 후기는 10개씩 페이지네이션
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

// 물품후기 이미지 조회 => N회 반복
// GET > http://localhost:3000/product/review/image?no=물품이미지번호
router.get('/review/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_review_no = Number(req.query.product_review_no);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: product_review_no };
        const result = await collection.findOne(query, { projection: { originalname: 1, filedata: 1, filetype: 1 } });

        // 4. 결과 값 반환
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 자신이 작성한 물품후기 조회
// GET > localhost:3000/product/review
router.get('/review', checkToken, async function (req, res, next) {
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

// 물품후기 등록
// POST > http://localhost:3000/product/review/register
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
            _id: product_review_no,
            member_id: member_id,
            product_code: product_code,
            content: review_content,
            rating: review_rating,
            originalname: req.files[0].originalname,
            filedata: req.files[0].buffer,
            filetype: req.files[0].mimetype,
            regdate: new Date()
        }

        // 9. product_review를 DB에 넣기
        result = await collection.insertOne(product_review);

        // 10. 결과 값 반환
        if (result.insertedId === product_review._id) {
            return res.send({ ret: 1, data: `${product_review.member_id}님의 후기 작성을 성공했습니다.` });
        }
        res.send({ ret: 0, data: '후기 작성을 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 수정
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
        const query = { _id: product_review_no, member_id: member_id };
        console.log(req.files.length);

        // 이미지가 첨부되어있지 않을 경우
        if (req.files.length === 0) {
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
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: `${result.matchedCount}개의 후기가 수정되었습니다.` });
            }
            res.send({ ret: 0, data: '후기작성을 실패했습니다.' });
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
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: `${result.matchedCount}개의 후기가 수정되었습니다.` });
            }
            res.send({ ret: 0, data: '후기작성을 실패했습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품후기 삭제
// DELETE > localhost:3000/product/review/delete
router.delete('/review/delete', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_review_no = Number(req.body.review_no);
        const member_id = req.idx;

        // 2. DB변경
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_review');

        // 3. 조건설정
        const query = { _id: product_review_no, member_id: member_id };

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

router.get('/image/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);
        console.log(product_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product_image');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { product_code: product_code };
        const result = await collection.findOne(query, { projection: { filedata: 1, filetype: 1 } });

        // 4. 결과 값 반환
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
        res.end;
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;