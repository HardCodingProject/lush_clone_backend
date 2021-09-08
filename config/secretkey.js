module.exports = {
    secretKey : 'aldfqkdgo12_21kdaf1', // salt값
    options   : {
        algorithm : 'HS256', // hash 알고리즘
        expiresIn : '1h',    // 발행된 토큰의 유효시간(1시간)
        issuer    : 'admin'  // 발행자
    }
}