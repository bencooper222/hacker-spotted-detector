const moment = require('moment-timezone');

exports.validateSpots = (messageObj, config = {}) => {
  validateImageExistence(messageObj);
  // console.log('image');

  adminInvalidation(messageObj);
  // console.log('admin');

  if (config.interactionsByDay != null)
    validateDailyRules(messageObj, config.interactionsByDay);
  // console.log('interaction');
};

// just checks that there is an image
const validateImageExistence = messageObj => {
  if (messageObj.files == null) {
    messageObj.spotted = [];
    return;
  }
  if (
    messageObj.files[0].mimetype != null &&
    messageObj.files[0].mimetype.slice(0, 5) !== 'image'
  )
    messageObj.spotted = [];

  // theoretically we could do some EXIF sniffing here. Not down.
};

const validateDailyRules = (messageObj, interactions) => {
  for (let i = 0; i < messageObj.spotted.length; i++) {
    const hash =
      messageObj.user < messageObj.spotted[i]
        ? messageObj.user + messageObj.spotted[i].userID
        : messageObj.spotted[i].userID + messageObj.user;

    const day = moment
      .unix(messageObj.ts)
      .tz(process.env.timezone)
      .day();
    // console.log('this', day, hash);
    if (interactions[day][hash] != null) {
      messageObj.spotted.splice(i, 1);
    } else {
      interactions[day][hash] = true;
    }
  }
};

const adminInvalidation = messageObj => {
  if (messageObj.reactions != null) {
    const denyReaction = messageObj.reactions.find(
      el => el.name === process.env.admin_deny,
    );
    if (
      denyReaction != null &&
      denyReaction.users.some(u => process.env.admins.indexOf(u)) !== -1
    )
      messageObj.spotted = [];
  }
};
