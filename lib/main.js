const { getAllSlackMessagesForWeek } = require('./slack');
const { isMessageValid } = require('./validation');
const moment = require('moment-timezone');

exports.createScores = async () => {
  const channelHistory = await getAllSlackMessagesForWeek(moment().format('X'));

  if (channelHistory.has_more)
    return { error: 'Not all messages were able to be retrieved' };

  const scoreObj = channelHistory.messages.reduce((acc, el) => {
    if (acc[el.user] == null)
      acc[el.user] = { name: el.spotter, score: 0, spots: 0, spotted: 0 };
    if (!isMessageValid(el)) return acc; // TODO: I need to edit this so multispot photos with multiple poeple only DQ spots already taken

    acc[el.user].spots++;
    acc[el.user].score++;

    el.spotted.forEach(spotTarget => {
      if (acc[spotTarget.userID] == null)
        acc[spotTarget.userID] = {
          name: spotTarget.name,
          score: 0,
          spots: 0,
          spotted: 0,
        };
      acc[spotTarget.userID].spotted++;
      acc[spotTarget.userID].score--;
    });

    return acc;
  }, {});

  //   return scoreObj;
  return Object.keys(scoreObj)
    .map(id => ({
      ...scoreObj[id],
      id,
    }))
    .sort((a, b) => b.score - a.score);
};
