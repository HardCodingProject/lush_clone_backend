const secretkey = require('./secretkey').secretKey;
const jwt = require('jsonwebtoken');

// MongoDB 모듈
const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const mongourl = 'mongodb://id304:pw304@1.234.5.158:37017/id304';

const auth = {
    checkToken: async (req, res, next) => {
        console.log(req.headers);
        const token = req.headers.token;

        // 토큰이 존재하지 않을 경우
        if (!token) {
            return res.send({ ret: -1, data: 'token not issued' });
        }

        try {
            const user = jwt.verify(token, secretkey);

            if (typeof (user.idx) === 'undefined') {
                return res.send({ ret: -1, data: 'invalid token' });
            }

            // 1. DB연결
            const dbconn = await mongoClient.connect(mongourl);
            const collection = dbconn.db('id304').collection('lushMember');

            // 2. DB조회
            const query = { _id: user.idx };
            const result = await collection.findOne(query, { projection: { token: 1 } });

            // 3. 결과 값 리턴
            if (result.token.token !== token) {
                return res.send({ ret: -1, data: 'invalid token' });
            }

            // 4. 오류가 없다면, 전달 값을 req에 보관
            req.idx = user.idx;
            next();
        } catch (error) {
            console.error(error);
            if (error.message === 'jwt expired') {
                return res.send({ ret: -1, data: 'token expired' });
            }
            else if (error.message === 'invalid token') {
                return res.send({ ret: -1, data: 'invalid token' });
            }
            else {
                return res.send({ ret: -1, data: 'invalid token' });
            }
        }
    }
}

module.exports = auth;