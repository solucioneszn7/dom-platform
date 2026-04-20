// ===== Firebase Functions — Entry Point =====
// Re-exporta todas las funciones definidas en src/
const syncPlace = require('./src/syncPlace')

exports.syncPlace = syncPlace.syncPlace
exports.syncPlaceScheduled = syncPlace.syncPlaceScheduled
