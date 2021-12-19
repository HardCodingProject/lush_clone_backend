# Problems and Solutions

---

## 회원가입 시 보안을 위해 비밀번호 암호화 작업
### 1. 문제정의
- 암호화를 하지 않고 비밀번호를 그대로 DB에 넣었을 경우, 보안 문제가 발생

### 2. 사실수집
- POSTMAN을 실행하고 회원가입에 대한 필요정보를 입력한 후, ROUTER 주소를 입력한 후 POST메서드로 전송을 할 경우 MongoDB에 입력받은 비밀번호가 그대로 저장되는 것을 확인
- `SQL injection`과 같은 공격이 발생했을 경우 암호화를 하지 않으면 사용자의 비밀번호가 그대로 노출되는 상황이 발생할 것으로 예상

### 3. 원인추론
- 암호화 과정을 수행하는 코드 미작성

### 4. 조사방법결정
- Node.js의 내장 모듈인 Crypto를 사용하여 암호화하는 방법을 조사

### 5. 조사방법구현
``` JavaScript
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
```
- `const hashPassword = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');`
-  SHA256을 사용한 암호화를 수행, 여기서 비밀키는 회원의 아이디로 설정(유일성)
-  HMAC SHA256의 경우 데이터를 주어진 salt값과 함께 해싱을 수행하고, 해싱된 결과물을 salt값과 한번 더 해싱을 수행함 => 해시의 보안이 강화되는 결과를 확인할 수 있음

### 6. 문제해결
- Node.js의 내장 모듈인 Crypto를 사용하여 비밀번호 암호화를 수행한 후 DB에 데이터를 저장하는 방법으로 변경
- **[적용 후 사진]**
![image](https://user-images.githubusercontent.com/38236367/146666592-72d198e2-8829-431a-b764-33321ffb4510.png)

---

## 회원가입 시 보안을 위해 비밀번호 암호화 작업
### 1. 문제정의
- 암호화를 하지 않고 비밀번호를 그대로 DB에 넣었을 경우, 보안 문제가 발생

### 2. 사실수집
- POSTMAN을 실행하고 회원가입에 대한 필요정보를 입력한 후, ROUTER 주소를 입력한 후 POST메서드로 전송을 할 경우 MongoDB에 입력받은 비밀번호가 그대로 저장되는 것을 확인
- `SQL injection`과 같은 공격이 발생했을 경우 암호화를 하지 않으면 사용자의 비밀번호가 그대로 노출되는 상황이 발생할 것으로 예상

### 3. 원인추론
- 암호화 과정을 수행하는 코드 미작성

### 4. 조사방법결정
- Node.js의 내장 모듈인 Crypto를 사용하여 암호화하는 방법을 조사

### 5. 조사방법구현
``` JavaScript
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
```
- `const hashPassword = crypto.createHmac('sha256', salt).update(req.body.password).digest('hex');`
-  SHA256을 사용한 암호화를 수행, 여기서 비밀키는 회원의 아이디로 설정(유일성)
-  HMAC SHA256의 경우 데이터를 주어진 salt값과 함께 해싱을 수행하고, 해싱된 결과물을 salt값과 한번 더 해싱을 수행함 => 해시의 보안이 강화되는 결과를 확인할 수 있음

### 6. 문제해결
- Node.js의 내장 모듈인 Crypto를 사용하여 비밀번호 암호화를 수행한 후 DB에 데이터를 저장하는 방법으로 변경
- **[적용 후 사진]**
![image](https://user-images.githubusercontent.com/38236367/146666592-72d198e2-8829-431a-b764-33321ffb4510.png)

---
