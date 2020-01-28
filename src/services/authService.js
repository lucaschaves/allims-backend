require("dotenv").config();

const jwt = require("jsonwebtoken");

const pool = require("../config/db");
const { loadData } = require("../utils/query");
const sql = require("../sql/authSql");

const getUserByLogin = async (login, password) => {
  let user = {};
  await loadData(pool, sql.getUserByLoginSQL, [login, password]).then(
    (res = []) => {
      console.log("res", res);
      user = res[0];
    }
  );
  return user;
};

const getTokenByUser = async user => {
  const { login } = user;
  const token = await jwt.sign({ name: login }, process.env.SECRET, {
    expiresIn: "1 day"
  });
  return token;
};

const doLogin = async (login, password) => {
  const user = (await getUserByLogin(login, password)) || {};

  if (!user || user === {}) {
    return { error: { status: 400, message: "User not found!" } };
  } else if (!user.enabled) {
    return { error: { status: 403, message: "Forbidden access!" } };
  } else if (user.externalPassword !== user.passwordHash) {
    return { error: { status: 400, message: "Invalid user or password!" } };
  } else {
    const token = await getTokenByUser(user);
    return { data: { token } };
  }
};

const validateToken = async (token = "") => {
  let data = { valid: false };
  await jwt.verify(token, process.env.SECRET, (err, decoded) => {
    data = { valid: !err };
  });
  return data;
};

const refreshToken = async (oldToken = "") => {
  let response = {};
  await jwt.verify(oldToken, process.env.SECRET, async (err, decoded) => {
    if (err) {
      response = {
        error: {
          status: 400,
          message: "Error occurred during the token validation"
        }
      };
    } else if (!decoded) {
      response = { error: { status: 400, message: "Invalid Token!" } };
    } else {
      const token = await getTokenByUser(decoded);
      response = { data: { token } };
    }
  });
  return response;
};

module.exports = {
  getUserByLogin,
  getTokenByUser,
  doLogin,
  validateToken,
  refreshToken
};
