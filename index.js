if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const { parse } = require('url');
const { createScores } = require('./lib/main');
const moment = require('moment-timezone');

module.exports = async (req, res) => {
  try {
    const { query } = parse(req.url, true);
    // console.log(query);
    const time =
      query.time == null || query.time < 1388617536 // Jan 1, 2014
        ? moment().format('X')
        : query.time;
    const scores = JSON.stringify(await createScores(time));
    res.end(scores);
  } catch (err) {
    res.end(JSON.stringify(err));
  }
};
