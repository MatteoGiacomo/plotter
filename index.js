const rawData = require('./data.json');

// cache to keep aggragationOverall data to improve getDetails performance
let cacheAggragationOverall = null;

/**
 * util to get filtered data based on keyName and keyValue
 * @param {Array} data - array of objects which should contain a key called keyName 
 * @param {String} keyName 
 * @param {String} keyValue 
 * @returns {Object}
 */
function getFilteredData (data, keyName, keyValue) {
  // (using filter to avoid polyfill for browser compatibility)
  // assuming only one keyName is present in data
  return data.filter(obj => obj[keyName] === keyValue)[0] || {}; // default value if no result are found
}


/**
 * util to pre-process rawData and return an object with required details
 * @param {String} keyValue 
 * @returns {Object}
 */
function getDetails (keyValue) {
  if (!cacheAggragationOverall) {
    cacheAggragationOverall = getFilteredData(rawData.data, 'slug', 'aggregation-overall'); 
  }
  return getFilteredData(cacheAggragationOverall.details, 'key', keyValue);
};


/**
 * create a dictionary with date as key and info as value
 * in order to have constat time complexity for search in getRangeData
 * @returns {Object}
 */
function getExtras () {
  const extras = getDetails('extra');

  return extras.series.reduce((acc, serie) => {
    return {
      ...acc,
      [serie.x]: serie.y
    }
  }, {});
};


module.export = function getRangeData (startDate, endDate) {
  // pre-proccess rawData in order to reduce complexity
  const scores = getDetails('score');
  const extras = getExtras();

  return scores.series.reduce((acc, score) => {
    // assuming dates are in ISO format with no time zone 
    if (score.x >= startDate && score.x <= endDate) {
      return [
        ...acc,
        {
          ...score,
          extra: extras[score.x]
        }
      ]
    }
    return acc;
  }, []);
};




