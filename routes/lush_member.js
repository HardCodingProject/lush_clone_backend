// 파일명: lush_member.js
var express = require('express');
var router = express.Router();

// 패스워드 암호화 모듈
const crypto = require('crypto');

// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

// 로그인 토큰 발행
const randToken = require('rand-token');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretkey').secretKey;
const options = require('../config/secretkey').options;
const checkToken = require('../config/auth').checkToken;

// 회원가입 => 아이디, 비밀번호, 비밀번호확인, 이름, 이메일, 휴대폰번호, 우편번호, 배송주소
// POST > localhost:3000/member/join
router.post('/join', async function (req, res, next) {
    try {
        // 1. 비밀번호 암호화 => 아이디 값은 고유하기 때문에 솔트 값으로 지정
        const salt = req.body.id;
        const hashPassword = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');
  
        // 2. 전달되는 값 받기(아이디, 비밀번호, 이름, 이메일, 휴대폰번호, 우편번호, 배송주소, 등록일자)
        const memberData = {
            _id: req.body.id,
            password: hashPassword,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            zip_code: req.body.zip_code,
            shipping_address: req.body.shipping_address,
            regdate: new Date()
        }

        // 3. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 4. DB에 memberData 저장
        const result = await collection.insertOne(memberData);

        // 5. DB닫기
        dbconn.close();

        // 6. 결과 리턴
        if (result.insertedId === memberData._id) {
            res.send({ ret: 1, data: `${memberData.name}님의 회원가입을 축하합니다.` });
        } else {
            res.send({ ret: 0, data: '회원가입을 실패했습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 아이디 중복확인
// GET > localhost:3000/member/checkid?id=회원아이디
router.get('/checkid', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.query.id;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 3. DB에서 아이디를 조건으로 개수 조회
        const query = { _id: id };
        const result = await collection.countDocuments(query);

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴(0일 경우 일치하는 아이디가 없음, 1일 경우 일치하는 아이디가 존재)
        if(result === 1){
            res.send({ ret: 1, data: '이미 사용 중인 아이디입니다.'});
        }
        else{
            res.send({ret:0, data : '사용가능한 아이디입니다.'});
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 로그인
// POST > localhost:3000/member/login
router.post('/login', async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.body.id;
        const password = req.body.password;

        // 2. 비밀번호는 해쉬 후 DB데이터와 비교
        const salt = req.body.id;
        const hashPassword = crypto.createHmac('sha256', salt).update(password).digest('hex');

        // 3. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 4. DB조회
        const query = { _id: id, password: hashPassword };
        const result = await collection.findOne(query);

        // 5. 결과 값에 따라 토큰 생성
        if (typeof (result) !== 'undefined') {
            // 5-1. 토큰에 저장되는 내용
            const payload = {
                idx: result._id,
                name: result.name
            };

            // 5-2. DB에 생성한 토큰을 UPDATE
            const resultToken = {
                token: jwt.sign(payload, secretKey, options),
                refreshToken: randToken.uid(256)
            }

            const tokenQuery = { _id: id };
            const changeData = { $set: { token: resultToken } };
            const tokenResult = await collection.updateOne(tokenQuery, changeData);
            if (tokenResult.modifiedCount === 1) {
                res.send({ ret: 1, jwtToken: resultToken });
            } else { 
                res.send({ ret: 0, data: 'token not issued' });
            }
        } else {
            res.send({ ret: 0, data: 'token not issued' });
        }

        // 6. DB닫기
        dbconn.close();
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 회원정보수정(이름, 이메일, 휴대폰번호, 우편번호, 배송주소, 새비밀번호)
// PUT > localhost:3000/member/update
router.put('/update', checkToken, async function (req, res, next) {
    try {
        // 1. 토큰 인증 후 전달 값 받기
        const id = req.idx;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const zip_code = req.body.zip_code;
        const shipping_address = req.body.shipping_address
        const new_password = req.body.new_password;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        if (new_password === '') {
            // DB에 변경할 정보 업데이트
            const query = { _id: id };
            const changeData = { $set: { name: name, email: email, phone: phone, zip_code: zip_code, shipping_address: shipping_address } };
            const result = await collection.updateOne(query, changeData);

            // DB닫기
            dbconn.close();

            // 결과 값 리턴
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: `회원정보 수정을 성공하였습니다.` });
            }
            res.send({ ret: 0, data: '회원정보 수정을 실패하였습니다.' });
        } else {
            // 비밀번호 해시
            const salt = id;
            const hash_new_password = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');

            // DB에 변경할 정보 업데이트
            const query = { _id: id };
            const changeData = { $set: { password: hash_new_password, name: name, email: email, phone: phone, zip_code: zip_code, shipping_address: shipping_address } };

            // 결과 값 리턴
            if (result.matchedCount === 1) {
                return res.send({ ret: 1, data: `회원정보 수정을 성공하였습니다.` });
            }
            res.send({ ret: 0, data: '회원정보 수정을 실패하였습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 비밀번호 체크 => 이전에 사용한 비밀번호인 경우 사용할 수 없음
// GET > localhost:3000/member/checkpw
router.post('/checkpw', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.idx;
        const Password = req.body.Password;
        console.log(Password);

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');

        // 3. 새로운 비밀번호
        const salt = req.body.idx;
        console.log(salt);
        const hashPassword = crypto.createHmac('sha256', salt).update(Password).digest('hex');

        // 4. DB수정
        const query = {$and : [{_id: id, password: hashPassword}]};
        const result = await collection.countDocuments(query);

        // 4. DB닫기
        dbconn.close();
        console.log(result);
        // 5. 결과 값 리턴(0일 경우 일치하는 새로운 비밀번호 적용, 1일 경우 이전 비밀번호와 동일)
        res.send({ ret: 1, data: result });
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 로그아웃
// POST > localhost:3000/member/logout
router.post('/logout', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');
      
        // 3. DB UPDATE를 통해 TOKEN값 삭제
        const query = { _id: id};
        const changeData = {$set: {token: ''}};
        const result = await collection.updateOne(query, changeData);
        sessionStorage.removeItem('TOKEN');

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        if(result.matchedCount === 1){
            return res.send({ret: 1, data: '로그아웃 성공'});
        }
        res.send({ret: 0, data: '로그아웃 실패'});
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

// 회원탈퇴
// DELETE > localhost:3000/member/delete
router.delete('/delete', checkToken, async function (req, res, next) {
    try {
        // 1. 전달 값 받기
        const id = req.idx;

        // 2. DB연결
        const dbconn = await mongoClient.connect(mongourl);
        const collection = dbconn.db('id304').collection('lush_member');
      
        // 3. DB삭제
        const query = { _id: id};
        const result = await collection.deleteOne(query);
        sessionStorage.removeItem('TOKEN');

        // 4. DB닫기
        dbconn.close();

        // 5. 결과 값 리턴
        if(result.deletedCount === 1){
            return res.send({ret: 1, data: '회원탈퇴 성공'});
        }
        res.send({ret: 0, data: '회원탈퇴 실패'});
    } catch (error) {
        console.error(error);
        res.send({ ret: -1, data: error });
    }
});

module.exports = router;