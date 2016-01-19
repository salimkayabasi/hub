var mongoose = require('mongoose');
var utils = require(process.cwd() + '/libs/mongoose/util');
var Gde = mongoose.model('Gde');
var slug = require('slugify');

exports.findById = utils.getModel('Gde', {_id: 'gdeId'}, [['country', 'name']], true);
exports.list = utils.getModel('Gde', {}, [['country', 'name']]);
exports.productsByCode = utils.getModel('Gde', {product_codes: 'productCode'}, [['country', 'name']]);
exports.byCountry = utils.getModel('Gde', {country: 'country'}, [['country', 'name']]);
exports.products = function (req, res) {
  Gde.aggregate([
    {$match: {}}, /* Query can go here, if you want to filter results. */
    {$project: {products: 1}}, /* select the tokens field as something we want to 'send' to the next command in the chain */
    {$unwind: '$products'}, /* this converts arrays into unique documents for counting */
    {
      $group: {
        /* execute 'grouping' */
        _id: '$products', /* using the 'token' value as the _id */
        count: {$sum: 1} /* create a sum value */
      }
    }
  ], function (err, products) {
    var productsList = [];
    if (err) {
      return res.send(500, err);
    }
    if (products) {
      for (var i = 0; i < products.length; i++) {
        productsList.push({
          name: products[i]._id,
          // jshint -W106
          product_code: slug(products[i]._id.toLowerCase().replace('+', 'plus').replace(':', '-').replace('--', '-'))
          // jshint +W106
        });
      }
    }
    return res.json(productsList);
  });
};
