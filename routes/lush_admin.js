// 파일명: lush_admin.js
var express = require('express');
var router = express.Router();

// MongoDB 라이브러리
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 파일첨부 라이브러리
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 물품 등록
// POST > http://localhost:3000/admin/product/register
router.post('/product/register', upload.array('image'), async function (req, res, next) {
    try {
        // 1. seq_lush_product 컬렉션 연결을 위한 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_product');

        // query조건에 부합하는 결과 seq의 값을 가져온 후, 1증가
        var query = { _id: 'SEQ_PRODUCT_CODE' };
        var updateData = { $inc: { seq: 1 } };
        var result = await collection.findOneAndUpdate(query, updateData);

        // 2. 전달 값 받기
        const product_code = Number(result.value.seq);
        const category_code = Number(req.body.category_code);
        const product_name = req.body.product_name;
        const product_price = Number(req.body.product_price);
        const product_weight = req.body.product_weight;
        const product_tag = req.body.product_tag;

        // 3. DB에 넣을 데이터 가공하기
        product_data = {
            _id     : product_code,      // 물품 코드
            category_code: category_code,// 카테고리 코드
            name    : product_name,      // 물품 명
            price   : product_price,     // 물품 가격
            weight  : product_weight,    // 물품 무게
            tag     : product_tag,       // 물품 태그
            regdate : new Date()         // 물품 등록 날짜
        }

        // 4. lush_product 컬렉션 변경 후 product_data 저장
        collection = dbconn.db('id304').collection('lush_product');
        result = await collection.insertOne(product_data);

        // 5. product_data가 DB에 저장이 되었다면, 이미지 파일 저장을 위한 DB변경
        if (result.insertedId === product_data._id) {
            // 6. seq_lush_product_image 컬렉션으로 DB설정
            collection = dbconn.db('id304').collection('seq_lush_product_image');

            // 7. query조건에 부합하는 결과 seq의 값을 가져온 후, 1증가
            query = { _id: 'SEQ_PRODUCT_IMAGE_NO' };
            updateData = { $inc: { seq: 1 } };

            // 8. product_image_data배열 선언, 전달 받은 파일의 개수를 알기위한 변수 선언
            const product_image_data = new Array();
            const num_of_images = req.files.length;

            // 9. num_of_images의 값 만큼 반복문 수행
            for (let i = 0; i < num_of_images; i++) {
                result = await collection.findOneAndUpdate(query, updateData);
                const product_image_no = result.value.seq;

                // 10. DB에 넣을 데이터 가공하기
                product_image_data.push({
                    _id         : product_image_no,        // 물품 이미지 번호
                    product_code: product_data._id,        // 물품 코드
                    originalname: req.files[i].originalname, // 파일 이름
                    filedata    : req.files[i].buffer,     // 파일 버퍼
                    filetype    : req.files[i].mimetype,   // 파일 타입
                    priority    : Number(i + 1)            // 우선 순위
                })
            }

            // 11. lush_product_image 컬렉션으로 DB설정
            collection = dbconn.db('id304').collection('lush_product_image');

            // 12. 결과 값 반환
            result = await collection.insertMany(product_image_data);

            if (result.insertedCount === product_image_data.length) {
                return res.send({ ret: 1, data: '물품 등록을 성공했습니다.' });
            }
            return res.send({ ret: 0, data: '물품 등록을 실패했습니다.' });
        }
        res.send({ ret: 0, data: '물품 등록을 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 삭제
// DELETE > http://localhost:3000/admin/product/delete
router.delete('/product/delete', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.body.product_code);

        // 2. lush_product 컬렉션에 연결하기 위한 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 3. 조건 설정 및 삭제
        var query = { _id: product_code };
        var result = await collection.deleteOne(query);

        // 삭제가 완료되었다면, 이미지 파일을 삭제하기 위한 DB변경
        if (result.deletedCount === 1) {
            collection = dbconn.db('id304').collection('lush_product_image');

            // 조건 설정 및 삭제
            query = { product_code: product_code };
            result = await collection.deleteMany(query);

            // 결과 값 반환
            if (result.deletedCount > 0) {
                return res.send({ ret: 1, data: '물품 삭제를 성공했습니다.' });
            }
            return res.send({ ret: 0, data: '물품 삭제를 실패했습니다.' });
        }
        res.send({ ret: 0, data: '물품 삭제를 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 수정
// PUT > http://localhost:3000/admin/product/update
router.put('/product/update', upload.array('image'), async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.body.product_code);
        const product_name = req.body.product_name;
        const product_price = Number(req.body.product_price);
        const product_weight = req.body.product_weight;
        const product_tag = req.body.product_tag;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 3-1. 이미지가 첨부되어 있을 경우
        if (req.files.length > 0) {
            var query = { _id: product_code };
            var changeData = {
                $set: {
                    name  : product_name,  // 물품 명
                    price : product_price, // 물품 가격
                    weight: product_weight,// 물품 무게
                    tag   : product_tag    // 물품 태그
                }
            }
            
            // 결과 값 반환
            var result = await collection.updateOne(query, changeData);

            // 이미지 변경
            if (result.matchedCount === 1) {
                var count = 0;

                // 변경할 이미지의 정보를 받아오기
                const num_of_images = req.files.length;

                // DB변경
                var collection = dbconn.db('id304').collection('lush_product_image');

                // 파일의 개수만큼 반복문 수행
                for (let i = 0; i < num_of_images; i++) {
                    query = { product_code: product_code, priority: Number(i + 1) };
                    changeData = {
                        $set: {
                            originalname: req.files[i].originalname,
                            filedata: req.files[i].buffer,
                            filetype: req.files[i].mimetype
                        }
                    }
                    // 결과 값 반환
                    result = await collection.updateOne(query, changeData);
                    if (result.matchedCount === 1) {
                        count = count + result.matchedCount;
                    }
                }
                if (count === num_of_images) {
                    return res.send({ ret: 1, data: '물품 수정을 성공했습니다.' });
                }
                return res.send({ ret: 0, data: '물품 수정을 실패했습니다.' });
            }
            res.send({ret: 0, data: '물품 수정을 실패했습니다.'});
        }
        // 3-2. 이미지가 없을 경우
        else{
            const query = { _id: product_code };
            const changeData = {
                $set: {
                    name  : product_name,  // 물품 명
                    price : product_price, // 물품 가격
                    weight: product_weight,// 물품 무게
                    tag   : product_tag    // 물품 태그
                }
            }
            // 결과 값 반환
            const result = await collection.updateOne(query, changeData);
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: '물품 수정을 성공했습니다.' });
            }
            res.send({ ret: 0, data: '물품 수정을 실패했습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 목록 조회
// GET > http://localhost:3000/admin/product/list?search=검색명&category_code=카테고리코드
router.get('/product/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const search = req.query.search;
        const category_code = Number(req.query.category_code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색 (20개를 기준으로 페이지네이션)
        const query = { name: new RegExp(search, 'i'), category_code: category_code };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 한 개 조회
// GET > http://localhost:3000/admin/product?code=물품코드
router.get('/product', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product');

        // 3. 입력 값을 포함하여 검색
        const query = { _id: product_code };
        const result = await collection.findOne(query);

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 이미지 표시
// GET > http://localhost:3000/admin/product/image?code=물품코드&priority=물품이미지순서
router.get('/product/image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);
        const product_priority = Number(req.query.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product_image');

        // 3. 조회 조건
        const query = { product_code: product_code, priority: product_priority };
        const result = await collection.findOne(query, { projection: { originalname: 1, filedata: 1, filetype: 1 } });

        // 4. 이미지 출력
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 물품 타입 이미지 표시
// GET > http://localhost:3000/admin/product/type-image?code=물품코드&priority=물품이미지순서
router.get('/product/type-image', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const product_code = Number(req.query.code);
        const product_priority = Number(req.query.priority);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('lush_product_type_image');

        // 3. 조회 조건
        const query = { product_code: product_code, priority: product_priority };
        const result = await collection.findOne(query, { projection: { name, originalname: 1, filedata: 1, filetype: 1 } });

        // 4. 이미지 출력
        res.contentType(result.filetype);
        res.send(result.filedata.buffer);
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 등록
// POST > http://localhost:3000/admin/category/register
router.post('/category/register', async function (req, res, next) {
    try {
        // 1. seq_lush_category 컬렉션 연결을 위한 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        var collection = dbconn.db('id304').collection('seq_lush_category');

        // 2. _id가 SEQ_CATEGORY_CODE인 항목에 대해 seq속성을 1증가
        const query = { _id: 'SEQ_CATEGORY_CODE' };
        var result = await collection.findOneAndUpdate(query, { $inc: { seq: 1 } });

        // 3. 전달 값을 받아 각 변수에 저장
        const category_code = result.value.seq;
        const category_name = req.body.category_name;

        // 4. lush_category 컬렉션으로 DB설정
        var collection = dbconn.db('id304').collection('lush_category');

        // 5. DB에 저장할 데이터 만들기
        const category_data = {
            _id: category_code,  // 카테고리 코드
            name: category_name   // 카테고리 명
        };

        // 6. category_data객체를 lush_category컬렉션에 넣는다.
        result = await collection.insertOne(category_data);

        // 7. 결과 값 반환
        if (result.insertedId === category_data._id) {
            return res.send({ ret: 1, data: `${category_data.name} 카테고리가 추가되었습니다.` });
        }
        res.send({ ret: 0, data: '카테고리 추가를 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 목록 조회
// GET > http://localhost:3000/admin/category/list?name=카테고리 명
router.get('/category/list', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const category_name = req.query.name;

        // 2. lush_category 컬렉션으로 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. 카테고리 명을 입력 값으로 받아 조건을 설정
        const query = { name: new RegExp(category_name, 'i') };
        const result = await collection.find(query).sort({ _id: 1 }).toArray();

        // 4. 결과 값 반환
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 수정
// PUT > http://localhost:3000/admin/category/update
router.put('/category/update', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const category_code = Number(req.body.category_code);
        const category_name = req.body.category_name;

        // 2. lush_category 컬렉션으로 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. 조건과 일치하는 항목에 대해 변경할 데이터를 업데이트 수행
        const query = { _id: category_code };
        const changeData = { $set: { name: category_name } };
        const result = await collection.updateOne(query, changeData);

        // 4. 결과 값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: `${result.matchedCount}개의 카테고리를 수정했습니다.` });
        }
        res.send({ ret: 0, data: '카테고리 수정을 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 카테고리 삭제
// DELETE > http://localhost:3000/admin/category/delete
router.delete('/category/delete', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const category_code = Number(req.body.category_code);

        // 2. lush_category 컬렉션으로 DB설정
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_category');

        // 3. query의 조건에 부합하는 항목 삭제
        const query = { _id: category_code };
        const result = await collection.deleteOne(query);

        // 4. 결과 값 반환
        if (result.matchedCount === 1) {
            return res.send({ ret: 1, data: `${result.matchedCount}개의 카테고리를 삭제하였습니다.` });
        }
        res.send({ ret: 0, data: '카테고리 삭제를 실패했습니다.' });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;