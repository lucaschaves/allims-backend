const getUserByLoginSQL = `
SELECT
    pk_user AS id,
    cuser AS name,
    clogin AS login,
    password_hash AS "passwordHash",
    email,
    phones AS phone,
    CASE
        WHEN COALESCE(cdisable, '0') != '1' and COALESCE(access_denied, '0') != '1' THEN
            true
        ELSE
            false
    END AS enabled,
    lb_fc_get_password_hash($2::text, last_change_password::text) AS "externalPassword",
    last_change_password AS "lastPasswordChange"
FROM
    lb_users
WHERE
    TRIM(LOWER(clogin)) = TRIM(LOWER($1::text))
ORDER BY
    id
LIMIT
    1
`

module.exports = { getUserByLoginSQL }