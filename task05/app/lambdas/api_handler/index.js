// exports.handler = async (event) => {
//     // TODO implement
//     const response = {
//         statusCode: 200,
//         body: JSON.stringify('Hello from Lambda!'),
//     };
//     return response;
// };

const AWS = require('aws-sdk');

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: process.env.region
});

async function loginUser(email, password, userPoolId, clientId) {
    const params = {
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    try {
        const data = await cognitoIdentityServiceProvider.adminInitiateAuth(params).promise();
        const idToken = data.AuthenticationResult.IdToken;
        return {
            statusCode: 201,  // ✅ Changed from 200 to 201
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Authentication failed", details: error.message })
        };
    }
}

async function signUpUser(email, password, userPoolId, clientId) {
    const params = {
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: 'email', Value: email }]
    };

    try {
        await cognitoIdentityServiceProvider.signUp(params).promise();
        const confirmParams = {
            Username: email,
            UserPoolId: userPoolId
        };

        await cognitoIdentityServiceProvider.adminConfirmSignUp(confirmParams).promise();
        return {
            statusCode: 201,  // ✅ Changed from 200 to 201
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: 'OK' })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Signing up failed", details: error.message })
        };
    }
}

exports.handler = async (event) => {
    console.log(event);
    
    try {
        const body = JSON.parse(event.body);
        const userPoolId = process.env.CUPId;
        const clientId = process.env.CUPClientId;

        if (event.resource === '/login') {
            return await loginUser(body.email, body.password, userPoolId, clientId);
        } else if (event.resource === '/signup') {
            return await signUpUser(body.email, body.password, userPoolId, clientId);
        } else {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid resource path" })
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
