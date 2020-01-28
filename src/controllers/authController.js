const service = require('../services/authService')

const defineAuthRoutes = (r) => {
    r.get('/', (req, res) => res.status(200).json({
        status: "OK"}
    ))
    r.use('/login', loginController)
    r.use('/validate', validateController)
    r.use('/refresh', refreshController)
}

const loginController = async (req, res, next) => {
    try {
      req.query = req.query || {}
      req.body = req.body || {}
      const login = req.body.login || req.query.login
      const password = req.body.password || req.query.password
      const response = (await service.doLogin(login, password)) || {}
      if (response.error) {
        return res
          .status(response.error.status)
          .json({ errors: [response.error.message] })
      } else {
        res.status(200).json(response.data)
      }
    } catch (e) {
      next(e)
    }
}
  
const validateController = async (req, res, next) => {
    try {
      req.query = req.query || {}  
      req.body = req.body || {}
      const token = req.body.token || req.query.token
      const data = (await service.validateToken(token)) || {}
      return res.status(200).json(data)
    } catch (e) {
      next(e)
    }
}

const refreshController = async (req, res, next) => {
    try {
      req.query = req.query || {}
      req.body = req.body || {} 
      const token = req.body.token || req.query.token
      const response = (await service.refreshToken(token)) || {}
      if (response.error) {
        return res
          .status(response.error.status)
          .json({ errors: [response.error.message] })
      } else {
        res.status(200).json(response.data)
      }
    } catch (e) {
      next(e)
    }
}

module.exports = defineAuthRoutes