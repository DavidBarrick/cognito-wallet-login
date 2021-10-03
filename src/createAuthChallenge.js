module.exports.handler = async event => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  try {
    const { request = {} } = event;
    const { userNotFound } = request;
    if (userNotFound) {
      throw new Error('[404] User Not Found');
    }

    // We'll use a nonce here to make the message unique on each sign
    // in request to prevent replay attacks
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `I am signing my one-time nonce: ${nonce}`;
    // This is sent back to the client app
    event.response.publicChallengeParameters = { message };

    // This is used later in our VerifyAuthChallenge trigger
    event.response.privateChallengeParameters = { message };

    return event;
  } catch (err) {
    throw err;
  }
};
