const rawData = require('./data.json');

const AGGREGATION_SLUG = 'aggregation-overall';
const AGGREGATION_DETAILS_KEY = 'details'
const ADDITIONAL_INFO_KEY = 'extra'
const DETAILS_SERIES_KEY = 'score'
const DEFAULT_Y_VALUE = 0

// cache to keep aggragationOverall data
let cacheAggregation = null;


/**
 * util to get filtered data based on keyName and keyValue
 * @param {Array} data - array of objects which should contain a key called keyName 
 * @param {String} keyName 
 * @param {String} keyValue 
 * @returns {Object}
 */
function getFilteredData (data, keyName, keyValue) 
  // assuming only one keyName is present in data
  return data.filter(obj => obj[keyName] === keyValue)[0] || {}; // default value if no result are found
}


/**
 * util to pre-process rawData and return an object with required details
 * @param {String} keyValue 
 * @returns {Object}
 */
function getDetails (keyValue) {
  if (!cacheAggregation) {
    cacheAggregation = getFilteredData(rawData.data, 'slug', AGGREGATION_SLUG); 
  }
  return getFilteredData(cacheAggregation[AGGREGATION_DETAILS_KEY], 'key', keyValue);
};


/**
 * create a dictionary with date as key and info as value
 * in order to have constat time complexity for search in getRangeData
 * @returns {Object}
 */
function getAdditionalInfo () {
  const { series } = getDetails(ADDITIONAL_INFO_KEY);

  return series.reduce((acc, {x, y}) => {
    return {
      ...acc,
      [x]: y || {} // default value if no result are found
    }
  }, {});
};


/**
 * add startDate and endDate if not present in data,
 * assuming y's default value for line-graph is 0
 * @param {Array} data 
 * @param {String} startDate 
 * @param {String} endDate 
 */
function getWholeRange (data, startDate, endDate) {
  let partial = data;

  if (partial[0].x !== startDate) {
    partial.unshift({
      y: DEFAULT_Y_VALUE,
      x: startDate
    })
  };

  if (partial[partial.length - 1].x !== endDate) {
    partial.push({
      y: DEFAULT_Y_VALUE,
      x: endDate
    })
  };

  return partial;
};


function getScoresSubset (startDate, endDate) {
  // parse input params to get Unix time
  const paresdStartDate = Date.parse(startDate);
  const paresdEndDate = Date.parse(endDate);

  // check input params validity
  if (!paresdStartDate || !paresdEndDate) {
    console.error('[ Error getRangeData ]: input params are not properly formatted')
    return []
  }

  // pre-proccess rawData in order to reduce time complexity
  const { series } = getDetails(DETAILS_SERIES_KEY);
  const extras = getAdditionalInfo();

  // assuming series are not sorted by x 
  let partialResult = series.filter((score, idx) => {

    const parsedX = Date.parse(score.x);

    if (!parsedX) {
      console.warn(`[ Error getRangeData ]: score date at index ${idx} is not properly formatted`);
      return false;
    }

    return parsedX >= paresdStartDate && parsedX <= paresdEndDate
  });

  // add startDate and endDate if they didn't match any scores
  partialResult = getWholeRange(partialResult, startDate, endDate);

  // add extra info to scores
  return partialResult.reduce((acc, score) => ([
    ...acc,
    {
      ...score,
      extra: extras[score.x] || {}
    }
  ]), []);
};
