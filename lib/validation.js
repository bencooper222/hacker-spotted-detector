const moment = require('moment-timezone');

exports.validateSpots = (messageObj, config = {}) => {
  let removed = 0;
  removed += validateImageExistence(messageObj);
  // console.log('image');

  removed += adminInvalidation(messageObj);
  // console.log('admin');

  if (config.interactionsByDay != null)
    removed += validateDailyRules(messageObj, config.interactionsByDay);
  // console.log('interaction');

  return removed;
};

// just checks that there is an image
const validateImageExistence = messageObj => {
  const len = messageObj.spotted.length;
  if (messageObj.files == null) {
    messageObj.spotted = [];
    return 0;
  }

  if (
    messageObj.files[0].mimetype != null &&
    messageObj.files[0].mimetype.slice(0, 5) !== 'image'
  ) {
    messageObj.spotted = [];
  }
  return 0; // lack of or incorrect files probably aren't bad spots - they probably aren't spots.
  // theoretically we could do some EXIF sniffing here. Not down.
};

const validateDailyRules = (messageObj, interactions) => {
  let removed = 0;
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
      removed++;
    } else {
      interactions[day][hash] = true;
    }
    // if (removed > 0) console.log(hash);
  }

  return removed;
};

const adminInvalidation = messageObj => {
  const length = messageObj.spotted.length;
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

  return length - messageObj.spotted.length;
};
