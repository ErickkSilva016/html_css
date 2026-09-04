const crypto = require("crypto");

// Gera um código "copia e cola" NO FORMATO de um PIX, apenas para
// demonstração visual no front-end. NÃO é um código PIX real/válido.
// Para produção, isso deve ser substituído pela resposta de um gateway
// de pagamento real (Mercado Pago, PagSeguro, Efí/Gerencianet, Asaas etc.),
// que devolve o "brcode" e a imagem do QR Code prontos.
function generateFakePixCode(orderId, valor) {
  const random = crypto.randomBytes(10).toString("hex").toUpperCase();
  return `00020126580014BR.GOV.BCB.PIX0136${random}5204000053039865406${valor.toFixed(2)}5802BR5913MILISTORE LTDA6009SAO PAULO62070503***6304${orderId.toString().padStart(4, "0")}`;
}

module.exports = { generateFakePixCode };
