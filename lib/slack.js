const moment = require('moment-timezone'); // summon the beast
const Slack = require('slack-node');
const slack = new Slack(process.env.slack_token);

// time is any time in week - the bot automatically rewinds to the very beginning and returns all messages for that week.
// make it a unix string
exports.getAllSlackMessagesForWeek = async time => {
  // return await slack.channels.history({token: process.env.SLACK_TOKEN, channel: process.env.CHANNEL_ID});

  const sun = moment
    .unix(time)
    .tz(process.env.timezone)
    .day(0)
    .hour(0)
    .minute(0)
    .second(0)
    .millisecond(0);
  const sat = moment
    .unix(time)
    .tz(process.env.timezone)
    .day(6)
    .hour(11)
    .minute(59)
    .second(59)
    .millisecond(999);

  //   console.log(
  //     sun.format('YYYY-MM-DD HH:mm z'),
  //     sat.format('YYYY-MM-DD HH:mm z'),
  //   );

  const channelHistory = await getMessages(process.env.channel_id, sun, sat);

  // filter out threaded replies
  channelHistory.messages = channelHistory.messages.filter(
    message => message.parent_user_id == null,
  );
  const nameCache = {};

  // the airbnb style guide can go suck it
  for (let spot of channelHistory.messages) {
    spot.spotter = await getUserName(spot.user, nameCache);

    // .match is fucking stupid.
    let matches = spot.text.match(/<@[\w\d]{9}>/g);
    matches = matches == null ? [] : matches;

    spot.spotted = [
      ...new Set(
        await Promise.all(
          matches.map(async mention => {
            return {
              name: await getUserName(mention.slice(2, -1), nameCache),
              userID: mention.slice(2, -1),
            };
          }),
        ),
      ),
    ];
  }

  return channelHistory;
  // need
};

// note that this will only collect 1000 messages.
// That would mean the average VH member would have to make a spot 3 times a day to overflow this.
// that said, it's an issue worth keeping an eye on
const getMessages = (channel, oldest, latest, count = 1000) => {
  return new Promise((resolve, reject) => {
    slack.api(
      'channels.history',
      {
        channel,
        oldest: oldest.format('X'),
        latest: latest.format('X'),
        count: 1000,
      },
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      },
    );
  });
};

const getUserName = async (id, cache = {}) => {
  if (cache[id] != null) return cache[id];
  return new Promise((resolve, reject) => {
    slack.api('users.info', { user: id }, (err, res) => {
      if (err) reject(err);
      cache[id] = res.user.real_name;
      resolve(res.user.real_name);
    });
  });
};
