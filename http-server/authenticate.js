/**
 * Details: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
 */

const jwt = require('jsonwebtoken')
const jwkToPem = require('jwk-to-pem')
const { COGNITO_POOL_ID, COGNITO_REGION } = require('../constants/awsCognito')
const { keys } = require('./jwks.json')

module.exports.authenticateRequest = (req) => {
    const headerToCheck = req.headers['sec-websocket-protocol']
    if (!headerToCheck) {
        console.log('Header not present', headerToCheck)
        return false
    }

    const token = headerToCheck.split(',')?.[1].trim()
    if (!token) {
        console.log('Token not present', token)
        return false
    }

    const decoded = jwt.decode(token, { complete: true })
    if (!decoded) {
        console.log('Token invalid', token)
        return false
    }

    const { header } = decoded
    const key = keys.find((key) => key.kid === header.kid)

    if (!key) {
        console.log('Key not available', key, {
            needed: header.kid,
            available: keys.map({ kid }),
        })
        return false
    }

    const pem = jwkToPem(key)

    try {
        const decoded = jwt.verify(
            token,
            pem,
            /**
             * See: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
             */
            {
                algorithms: ['RS256'],
                issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
            }
        )

        if ('access' !== decoded.token_use) {
            return false
        }
        return true
    } catch (err) {
        console.error(err)
        return false
    }
}
