const utils = require('ethereumjs-util');
const web3 = require('web3');

module.exports.handler = async event => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  //This is the signature response from our Web3 app
  const signature = event.request.challengeAnswer;
  //Our usernames are the same as our public addresses
  const address = event.userName;

  const { v, r, s } = utils.fromRpcSig(signature);

  //Now for SOME REASON metamask prepends a few parameters
  const messageHash = web3.utils.sha3(
    '\u0019Ethereum Signed Message:\n' +
      event.request.privateChallengeParameters.message.length.toString() +
      event.request.privateChallengeParameters.message
  );
  const messageBuffer = new Buffer.from(messageHash.replace('0x', ''), 'hex');
  const recoveredPublicKey = utils.ecrecover(messageBuffer, v, r, s);
  const recoveredAddress = `0x${utils.pubToAddress(recoveredPublicKey).toString('hex')}`;

  if (address === recoveredAddress) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }
  return event;
};
