// 파일명: lush_admin.js
var express = require('express');
var router = express.Router();

// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 라이브러리
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 물품 일괄 추가(테스트 완료)
// POST > localhost:3000/admin/product/register
router.post('/product/register', upload.array('image'), async function (req, res, next) {
    try {
        // 1. 물품코드 가져오기
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_product');

        // 2. 전달 값 받은 후 productData에 저장
        var productData = [];
        // 2-1. 등록할 물품의 개수가 2개 이상인 경우
        if (Array.isArray(req.body.name)) {
            let index = 0;
            for (let i = 0; i < req.body.name.length; i++) {
                // SEQ_PRODUCT_CODE의 값을 result에 저장
                const result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_CODE' }, { $inc: { seq: 1 } });
                productData.push({
                    _id          : result.value.seq,                  // 물품코드
                    category_code: Number(req.body.category_code[i]), // 카테고리코드 
                    name         : req.body.name[i],                  // 물품명
                    price        : Number(req.body.price[i]),         // 물품가격
                    weight       : Number(req.body.weight[i]),        // 물품무게
                    tag          : req.body.tag[i],                   // 물품태그
                    image_first  : req.files[index].buffer,           // 물품 첫번째 이미지
                    image_second : req.files[index + 1].buffer,       // 물품 두번째 이미지
                    type_first: {                                     // 타입 첫번째 이미지
                        prductTypeText: req.files[index + 2].originalname,
                        buffer: req.files[index + 2].buffer
                    },
                    type_second: {                                    // 타입 두번째 이미지
                        prductTypeText: req.files[index + 3].originalname,
                        buffer: req.files[index + 3].buffer
                    },
                    regdate      : new Date()                         // 물품등록날짜
                });

                // 인덱스의 값 증가
                index = index + 4;
            }
        }
        // 2-2. 등록할 물품의 개수가 1개인 경우
        else {
            // SEQ_PRODUCT_CODE의 값을 result에 저장
            const result = await collection.findOneAndUpdate({ _id: 'SEQ_PRODUCT_CODE' }, { $inc: { seq: 1 } });
            let index = 0;
            console.log(req.files);
            productData.push({
                _id          : result.value.seq,                // 물품코드
                category_code: Number(req.body.category_code),  // 카테고리코드 
                name         : req.body.name,                   // 물품명
                price        : Number(req.body.price),          // 물품가격
                weight       : Number(req.body.weight),         // 물품무게
                tag          : req.body.tag,                    // 물품태그
                image_first  : req.files[index].buffer,         // 물품 첫번째 이미지
                image_second : req.files[index + 1].buffer,     // 물품 두번째 이미지
                type_first: {                                   // 타입 첫번째 이미지
                    prductTypeText: req.files[index + 2].originalname,
                    buffer: req.files[index + 2].buffer
                },
                type_second: {                                  // 타입 두번째 이미지
                    prductTypeText: req.files[index + 3].originalname,
                    buffer: req.files[index + 3].buffer
                },
                regdate      : new Date()                       // 물품등록날짜
            });
        }

        collection = dbconn.db('id304').collection('lush_product');
        const result = await collection.insertMany(productData);

        if (result.insertedCount === productData.length) {
            return res.send({ ret: 1, data: `${productData.length}개의 물품을 등록하였습니다.` });
        }
        res.send({ ret: 0, data: '물품 등록을 실패했습니다.' });
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
        var collection = dbconn.db('id304').collection('lush_product');

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

// 물품 일괄 수정(테스트완료) => 물품 이미지 수정은 넣지 않음
// PUT > localhost:3000/admin/product/update
router.put('/product/update', async function (req, res, next) {
    try {
        // 1. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 수정할 물품이 여러개인지 판단할 코드 변수
        const code = req.body.code;

        // 수정완료된 물품의 개수
        var count = 0;
        
        // 2. DB수정
        if (Array.isArray(code)) {
            for (let i = 0; i < code.length; i++) {
                const query = { _id: Number(code[i]) };
                const changeData = {
                    $set: {
                        name: req.body.name[i],                 // 물품명
                        price: Number(req.body.price[i]),       // 물품가격
                        weight: Number(req.body.weight[i]),     // 물품무게
                        tag: req.body.tag[i]                    // 물품태그
                    }
                };
                const result = await collection.updateOne(query, changeData);
                count += result.matchedCount;
            }

            // 3. 결과 값 리턴
            if (count === req.body.code.length) {
                return res.send({ ret: 1, data: `${count}개의 물품을 수정했습니다.` });
            }
            res.send('물품 수정을 실패하였습니다.');
        } else {
            const query = { _id: Number(code) };
            const changeData = {
                $set: {
                    name: req.body.name,                 // 물품명
                    price: Number(req.body.price),       // 물품가격
                    weight: Number(req.body.weight),     // 물품무게
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
// GET > localhost:3000/admin/product/list?page=페이지&search=검색명&category_code=카테고리코드
router.get('/product/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const page = Number(req.query.page);
        const search = req.query.search;
        const category_code = Number(req.query.category_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { name: new RegExp(search, 'i'), category_code: category_code };
        const result = await collection.find(query, { projection: { image_first: 0, image_second: 0, type_first: 0, type_second: 0 } }).sort({ _id: 1 }).skip((page - 1) * 20).limit(20).toArray();

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
        var collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: code };
        const result = await collection.findOne(query, { projection: { image_first: 0, image_second: 0, type_first: 0, type_second: 0 } });

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 이미지 표시(테스트중)
// GET > localhost:3000/admin/product/image?code=물품코드&number=이미지번호
router.get('/product/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const code = Number(req.query.code);
        const number = Number(req.query.number);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 3. 조회 조건
        const query = { _id: code };
        const result = await collection.findOne(query, { projection: { image_first: 1, image_second: 1, type_first: 1, type_second: 1 } });

        // 4. 입력받은 number에 맞게 이미지로 전송
        if (number === 1) {
            res.contentType('image/jpeg')
            res.send(result.image_first.buffer);
        }

        if (number === 2) {
            res.contentType('image/jpeg')
            res.send(result.image_second.buffer);
        }

        if (number === 3) {
            res.contentType('image/png')
            res.send(result.type_first.buffer);
        }

        if (number === 4) {
            res.contentType('image/png')
            res.send(result.type_second.buffer);
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 등록(테스트 완료)
// POST > localhost:3000/admin/category/register
router.post('/category/register', async function (req, res, next) {
    try {
        // 1. SEQ_CATEGORY_CODE 값을 받기 위한 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_category');

        // 2. 조건 값 조회하여 result에 저장한 후 1증가
        var result = await collection.findOneAndUpdate({ _id: 'SEQ_CATEGORY_CODE' }, { $inc: { seq: 1 } });

        // 3. 카테고리 항목을 등록하기 위한 DB연결 및 전달 값 받기
        const category_code = result.value.seq;
        const category_name = req.body.name;
        var collection = dbconn.db('id304').collection('lush_category');

        console.log(result);

        // 4. DB에 넣을 객체 만들기
        const categoryData = {
            _id: category_code, // 카테고리 코드
            name: category_name // 카테고리 명
        };

        // 5. 결과 값 반환
        result = await collection.insertOne(categoryData);

        if (result.insertedId === category_code) {
            return res.send({ ret: 1, data: `${categoryData.name} 카테고리가 추가되었습니다.` });
        }
        res.send({ ret: 0, data: '카테고리 추가를 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 목록 조회(테스트 완료)
// GET > localhost:3000/admin/category/list?name=카테고리명
router.get('/category/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const category_name = req.query.name;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. 입력 값을 포함하여 검색
        const query = { name: new RegExp(category_name, 'i') };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 목록 수정(테스트 완료)
// PUT > localhost:3000/admin/category/update
router.put('/category/update', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const code = Number(req.body.category_code);
        const name = req.body.name;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: code };
        const changeData = { $set: { name: name } };
        const result = await collection.updateOne(query, changeData);

        // 4. 결과 값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: `${result.matchedCount}개의 물품을 수정했습니다.` });
        }
        res.send('물품 수정을 실패하였습니다.');
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 목록 삭제(테스트 완료)
// DELETE > localhost:3000/admin/category/delete
router.delete('/category/delete', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const code = Number(req.query.category_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: code };
        const result = await collection.deleteOne(query);

        // 4. 결과 값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: `${result.matchedCount}개의 카테고리를 삭제하였습니다.` });
        }
        res.send({ ret: 0, data: '카테고리 삭제에 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;