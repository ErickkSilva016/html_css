// Listar todos os produtos (pode filtrar por categoria: livro ou papelaria)
const crypto = require('node:crypto');
const supabase = require('../config/supabase');
const supabaseAdmin = supabase.supabaseAdmin;

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'produtos';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

function parseImageData(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=]+)$/i);
  if (!match) throw new Error('A imagem deve ser JPG, PNG, WEBP ou GIF válido.');

  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('A imagem deve ter no máximo 4 MB.');
  }

  return { contentType, extension: IMAGE_TYPES.get(contentType), buffer };
}

async function uploadProductImage(dataUrl) {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada; não foi possível enviar a imagem.');
  }

  const { contentType, extension, buffer } = parseImageData(dataUrl);
  const filePath = `produtos/${crypto.randomUUID()}.${extension}`;
  const storage = supabaseAdmin.storage.from(STORAGE_BUCKET);

  let { error } = await storage.upload(filePath, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  // Facilita a primeira utilização: se o bucket ainda não existir, cria-o
  // como público e repete o upload. O client service role é obrigatório aqui.
  if (error && /not found|bucket/i.test(error.message || '')) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_IMAGE_BYTES}B`,
      allowedMimeTypes: [...IMAGE_TYPES.keys()],
    });
    if (!bucketError) {
      ({ error } = await storage.upload(filePath, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      }));
    }
  }

  if (error) throw error;
  const { data: publicUrlData } = storage.getPublicUrl(filePath);
  return { url: publicUrlData.publicUrl, path: filePath };
}

async function removeUploadedImage(filePath) {
  if (!filePath || !supabaseAdmin) return;
  try {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
  } catch (error) {
    console.error('Não foi possível limpar a imagem temporária:', error.message);
  }
}

exports.listarProdutos = async (req, res) => {
  try {
    const { categoria } = req.query; // Permite filtrar com ?categoria=livro ou ?categoria=papelaria
    let query = req.supabase.from('produtos').select('*');

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Buscar um único produto pelo ID (com a amostra da 1ª página)
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Produto não encontrado' });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Criar produto ou combo. Restrito a dona/admin (ver produtoRoutes.js) —
// o funcionário não cria nem apaga produto, só mexe em promoção.
exports.criarProduto = async (req, res) => {
  let uploadedImagePath = null;
  try {
    const {
      titulo,
      descricao,
      preco,
      categoria,
      genero,
      amostra_primeira_pagina,
      is_combo,
      imagem,
      imagem_data,
      promocao,
      preco_antigo,
      estoque,
    } = req.body;

    let imagemUrl = imagem ? String(imagem).trim() : null;
    if (imagem_data) {
      const uploaded = await uploadProductImage(imagem_data);
      imagemUrl = uploaded.url;
      uploadedImagePath = uploaded.path;
    }

    const produto = {
      titulo,
      descricao,
      preco,
      categoria,
      genero,
      amostra_primeira_pagina,
      is_combo: Boolean(is_combo),
      imagem: imagemUrl,
      promocao: Boolean(promocao),
      preco_antigo: promocao ? Number(preco_antigo) : null,
      estoque: Number(estoque || 0),
    };

    const { data, error } = await req.supabase
      .from('produtos')
      .insert([produto])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Produto criado com sucesso!', produto: data[0] });
  } catch (error) {
    await removeUploadedImage(uploadedImagePath);
    return res.status(500).json({ error: error.message });
  }
};

// Edição completa do produto. Restrito a dona/admin (ver produtoRoutes.js).
// Para promoção, o funcionário usa PATCH /produtos/:id/promocao.
exports.editarProduto = async (req, res) => {
  let uploadedImagePath = null;
  try {
    const { id } = req.params;
    const { imagem_data, ...payload } = req.body;
    const allowedFields = ['titulo', 'descricao', 'preco', 'categoria', 'genero', 'amostra_primeira_pagina', 'is_combo', 'imagem', 'promocao', 'preco_antigo', 'estoque'];
    const updates = Object.fromEntries(Object.entries(payload).filter(([key, value]) => allowedFields.includes(key) && value !== undefined));

    if (imagem_data) {
      const uploaded = await uploadProductImage(imagem_data);
      updates.imagem = uploaded.url;
      uploadedImagePath = uploaded.path;
    }

    if (updates.estoque !== undefined) updates.estoque = Number(updates.estoque);
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo válido foi informado.' });

    const { data, error } = await req.supabase.from('produtos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json({ message: 'Produto atualizado com sucesso!', produto: data });
  } catch (error) {
    await removeUploadedImage(uploadedImagePath);
    return res.status(500).json({ error: error.message });
  }
};

// Único caminho de escrita liberado para o funcionário: só promoção e
// preço antigo (pra exibir o "de/por"). Qualquer outro campo enviado no
// corpo é ignorado aqui — e, mesmo que alguém tente burlar isso, o
// trigger prevent_staff_full_edit no banco bloqueia a alteração.
exports.atualizarPromocao = async (req, res) => {
  try {
    const { id } = req.params;
    const { promocao, preco_antigo } = req.body;
    if (promocao === undefined) return res.status(400).json({ error: 'Informe o campo "promocao" (true ou false).' });

    const updates = { promocao: Boolean(promocao) };
    updates.preco_antigo = promocao ? (preco_antigo != null ? Number(preco_antigo) : null) : null;

    const { data, error } = await req.supabase.from('produtos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json({ message: 'Promoção atualizada com sucesso!', produto: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Remover produto. Restrito a dona/admin (ver produtoRoutes.js).
exports.removerProduto = async (req, res) => {
  try {
    const { error } = await req.supabase.from('produtos').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ message: 'Produto removido com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Itens que compõem um combo/kit (ex: livro + marca página + post-it +
// caneta), permitindo que cada item também seja comprado separadamente.
exports.listarItensCombo = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('combo_itens')
      .select('id, quantidade, produto:produto_id (id, titulo, preco, categoria, imagem)')
      .eq('combo_id', req.params.id);
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Define a composição do combo (substitui a lista anterior). Restrito a
// dona/admin — é estrutura de produto, não "promoção".
exports.definirItensCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const itens = Array.isArray(req.body.itens) ? req.body.itens : [];

    const { error: deleteError } = await req.supabase.from('combo_itens').delete().eq('combo_id', id);
    if (deleteError) throw deleteError;

    if (itens.length) {
      const rows = itens
        .filter(item => item && item.produto_id)
        .map(item => ({ combo_id: id, produto_id: item.produto_id, quantidade: Number(item.quantidade || 1) }));
      if (rows.length) {
        const { error: insertError } = await req.supabase.from('combo_itens').insert(rows);
        if (insertError) throw insertError;
      }
    }

    return res.status(200).json({ message: 'Composição do combo atualizada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
