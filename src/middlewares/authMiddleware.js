require('dotenv').config()

const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    next()
  } else {
    const authorization = req.headers['Authorization'] || req.query['auth']
    if (!authorization) return res.status(403).json({ errors: ['No token provided.'] })

    const token = authorization.split(' ').pop()
    if (!token) return res.status(403).json({ errors: ['No token provided.'] })

    jwt.verify(token, process.env.SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).json({
          errors: ['Failed to authenticate token.']
        })
      } else {
        req.decoded = decoded
        next()
      }
    })
  }
}

module.exports = auth