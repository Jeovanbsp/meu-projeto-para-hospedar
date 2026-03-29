const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    imagem: { type: String, required: true } // Guardará a imagem convertida em Base64
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);