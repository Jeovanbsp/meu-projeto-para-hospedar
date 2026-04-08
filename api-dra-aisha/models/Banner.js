const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    imagem: { type: String, required: true },
    ordem: { type: Number, default: 0 } // Campo essencial para a ordenação
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);