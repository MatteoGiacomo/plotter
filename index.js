const rawData = require('./data.json');

/**
 * Util to get filtered data 
 * @param {Array} data - array of objects which should contain a key called keyName 
 * @param {String} keyName 
 * @param {String} keyValue 
 */
function getDetails (data, keyName, keyValue) {
  // using filter to avoid polyfill for browser compatibility
  // assuming only one keyName is present in data
  return data.filter(obj => obj[keyName] === keyValue)[0] || {} // default value if no result are found
}

// pre-proccess rawData in order to reduce getRangeData complexity
function getScores () {
  const aggregationOverall = getDetails(rawData.data, 'slug', 'aggregation-overall'); 
  return getDetails(aggregationOverall.details, 'key', 'score');
};

function getRangeData (startDate, endDate) {
  const scores = getScores();
  return scores.series.filter(score => score.x >= startDate && score.x <= endDate);
};


