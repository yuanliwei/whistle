var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  res.json({ ec: 0, list: pluginMgr.getRegistryList() });
};
