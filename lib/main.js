const { getAllSlackMessagesForWeek } = require('./slack');
const { validateSpots } = require('./validation');
const moment = require('moment-timezone');

exports.createScores = async week => {
  const channelHistory = await getAllSlackMessagesForWeek(week);

  if (channelHistory.has_more)
    return { error: 'Not all messages were able to be retrieved' };

  const interactionsByDay = [];
  for (let i = 0; i < 7; i++) interactionsByDay[i] = {};

  const scoreObj = channelHistory.messages.reduce((acc, el) => {
    if (acc[el.user] == null)
      acc[el.user] = {
        name: el.spotter,
        score: 0,
        spots: 0,
        spotted: 0,
        invalidated: 0,
      };

    let removed = 0;
    if (el.spotted.length !== 0)
      removed = validateSpots(el, { interactionsByDay });

    acc[el.user].invalidated += removed;

    el.spotted.forEach(spotTarget => {
      if (acc[spotTarget.userID] == null)
        acc[spotTarget.userID] = {
          name: spotTarget.name,
          score: 0,
          spots: 0,
          spotted: 0,
          invalidated: 0,
        };
      acc[spotTarget.userID].spotted++;
      acc[spotTarget.userID].score--;

      acc[el.user].spots++;
      acc[el.user].score++;
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
