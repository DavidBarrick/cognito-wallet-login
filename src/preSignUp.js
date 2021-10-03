module.exports.handler = async event => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  event.response.autoConfirmUser = true;
  return event;
};
