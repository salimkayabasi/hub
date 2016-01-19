var mongoose = require('mongoose');
var extend = require('util')._extend;

module.exports = {
  /**
   * @param {object} query
   * @param {object} options
   * @param {string} options.sort
   * @param {number} options.asc
   * @param {number} options.page
   * @param {number} options.perpage
   * @returns {object} query with options applied
   */
  buildQuery: function (query, options) {
    var sort = options.sort;
    var asc = parseInt(options.asc || '1', 10);
    var fields = options.fields;
    var count = options.count;

    delete options.sort;
    delete options.asc;
    delete options.fields;
    delete options.count;
    delete options.page;
    delete options.perpage;

    if (!count) {
      if (sort) {
        var sortOptions = {};
        sortOptions[sort] = asc;
        query.options.sort = sortOptions;
      }
      if (fields) {
        query.select(fields.split(/[ ,]+/).join(' '));
      }
    }
    return query;
  },

  /**
   * @param {object} query
   * @param {number} pageNumber
   * @param {number} resultsPerPage
   * @param {Function} callback
   */
  paginate: function (query, pageNumber, resultsPerPage, callback) {
    callback = callback || function () {
      };
    pageNumber = (!isNaN(pageNumber) && pageNumber !== undefined) ? parseInt(pageNumber) : 1;
    resultsPerPage = resultsPerPage || 25;
    var skipFrom = (pageNumber * resultsPerPage) - resultsPerPage;
    if (resultsPerPage !== -1) {
      query.limit(resultsPerPage);
    } else {
      delete query.options.limit;
    }
    var queryStep = query.skip(skipFrom);
    queryStep.exec(function (error, results) {
      if (error) {
        callback(error, null, null, null, null, null);
      } else {
        query.model.count(query, function (error, count) {
          if (error) {
            callback(error, null, null);
          } else {
            var pageCount = Math.ceil(count / resultsPerPage);
            if (pageCount === 0) {
              pageCount = 1;
            }
            callback(null, count, pageNumber, resultsPerPage, pageCount, results);
          }
        });
      }
    });
  },

  /**
   * @param {object} query
   * @param {string} key
   * @param {string} value
   * @param {boolean} it
   * @returns {{}|*}
   */
  parseAndOr: function (query, key, value, it) {
    var elements, o, i;

    if (!value || typeof value === 'object') {
      return null;
    }

    if (value.indexOf(',') !== -1) {
      elements = value.split(',');
      query.$or = [];

      delete query[key];

      for (i = 0; i < elements.length; i++) {
        o = {};
        query.$or.push(this.parseAndOr(query, key, elements[i], true));
      }
    } else if (value.indexOf('+') !== -1) {
      elements = value.split('+');

      if (it) {
        o = {};
        o.$and = [];
        for (i = 0; i < elements.length; i++) {
          var or = {};
          or[key] = elements[i];
          o.$and.push(or);
        }
        return o;
      } else {
        delete query[key];

        query.$and = [];
        for (i = 0; i < elements.length; i++) {
          o = {};
          o[key] = elements[i];
          query.$and.push(o);
        }
      }
    } else {
      if (it) {
        o = {};
        o[key] = value;
        return o;
      } else {
        query[key] = value;
      }
    }
  },

  /**
   * @param {string} model name
   * @param {object} baseQuery
   * @param {array} populate
   * @param {boolean} one
   * @param {object} options
   * @returns {Function}
   */
  getModel: function (model, baseQuery, populate, one, options) {
    var me = this;
    one = one || false;
    populate = populate || [];
    options = options || {};

    return function (req, res) {
      var targetQuery, i;
      var count = false;
      var Model = mongoose.model(model);
      var query = extend({}, baseQuery);
      for (var key in query) {
        me.parseAndOr(query, key, req.params[query[key]]);
      }
      if (req.query.count) {
        count = true;
        targetQuery = Model.count(query);
      } else {
        if (one) {
          targetQuery = Model.findOne(query, null, options);
        } else {
          targetQuery = Model.find(query, null, options);
        }

        for (i = 0; i < populate.length; i++) {
          var entity = populate[i];

          if (entity instanceof Array) {
            targetQuery = targetQuery.populate(entity[0], entity[1]);
          } else {
            targetQuery = targetQuery.populate(entity);
          }
        }
      }
      if (count) {
        me.buildQuery(targetQuery, req.query).exec(function (err, count) {
          if (err) {
            console.log(err);
            res.send(400, 'Bad request');
          } else {
            res.jsonp({
              count: count
            });
          }
        });
      } else if (one) {
        me.buildQuery(targetQuery, req.query).exec(function (err, item) {
          if (err) {
            console.log(err);
            res.send(400, 'Bad request');
          } else if (item) {
            res.jsonp(item);
          } else {
            res.send(404, 'Not found');
          }
        });
      } else {
        var page = parseInt(req.query.page);
        var perpage = req.query.perpage ? parseInt(req.query.perpage) : undefined;
        if (perpage && perpage < -1) {
          res.send(400, 'Bad request');
        }
        me.paginate(me.buildQuery(targetQuery, req.query), page, perpage,
          function (err, count, pageNumber, resultsPerPage, pageCount, results) {

            if (err) {
              console.log(err);
              res.send(400, 'Bad request');
            } else {
              var response = {
                'count': count
              };

              console.log('resultsPerPage :' + resultsPerPage);
              if (resultsPerPage !== -1) {
                response.pages = pageCount;
                response.page = pageNumber;
                response.perpage = resultsPerPage;
              }

              response.items = results;
              res.jsonp(response);
            }
          });
      }
    };
  }
};
