const slack = require('./lib/slack');
const { createScores } = require('./lib/main');
const moment = require('moment-timezone');

module.exports = async (req, res) => {
  try {
    const scores = JSON.stringify(await createScores());
    res.end(scores);
  } catch (err) {
    res.end(JSON.stringify(process.env));
  }
};
