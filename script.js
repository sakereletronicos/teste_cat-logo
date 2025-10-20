const spreadsheetId = ''; // Insira seu ID aqui
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;

let produtos = [];
let colIndex = {};

fetch(url)
  .then(res => res.text())
  .then(txt => {
    const jsonStr = txt.match(/(?<=\().*(?=\);)/s)[0];
    const json = JSON.parse(jsonStr);

    const cols = json.table.cols.map(c => c.label.trim().toLowerCase());
    cols.forEach((colName, i) => {
      colIndex[colName] = i;
    });

    produtos = json.table.rows.slice(1).map(row => {
      const c = row.c;
      return {
        nome: c[colIndex['nome']]?.v || '',
        categoria: c[colIndex['categoria']]?.v || '',
        preco: c[colIndex['preço']]?.v || '0',
        link: c[colIndex['link']]?.v || '#',
        imagem: c[colIndex['imagem']]?.v || '',
        ativo: c[colIndex['ativo']]?.v ?? true,
        desconto: c[colIndex['desconto']]?.v || null       };
    });

    populaCategorias();
    renderProdutos(produtos);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('catalogo').innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
  });

const catalogoEl = document.getElementById('catalogo');
const buscaEl = document.getElementById('busca');
const categoriaEl = document.getElementById('categoria');
const precoEl = document.getElementById('preco');

function populaCategorias() {
  const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
  cats.forEach(cat => {
    const op = document.createElement('option');
    op.value = op.textContent = cat;
    categoriaEl.appendChild(op);
  });
}

function renderProdutos(lista) {
  catalogoEl.innerHTML = lista.length
    ? lista.map(p => `
      <div class="produto ${p.ativo === true || p.ativo === 'TRUE' ? '' : 'esgotado'}">
        <a href="${p.link}" target="_blank" rel="noopener noreferrer">
          <img src="${p.imagem}" alt="${p.nome || 'Produto'}" />
          <h2>${p.nome}</h2>
          <p>${p.categoria}</p>
          <div class="preco">R$ ${!isNaN(p.preco) ? Number(p.preco).toFixed(2) : '---'}</div>
          ${p.ativo === true || p.ativo === 'TRUE' ? '' : '<span class="tag-esgotado">Esgotado</span>'}
        </a>
      </div>
    `).join('')
    : '<p>Nenhum produto encontrado.</p>';
}

function filtrar() {
  const b = buscaEl.value.toLowerCase();
  const c = categoriaEl.value;
  const pr = precoEl.value;

  let filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(b) &&
    (c === '' || p.categoria === c)
  );

  if (pr) {
    const [min, max] = pr.split('-').map(Number);
    filtrados = filtrados.filter(p => Number(p.preco) >= min && Number(p.preco) <= max);
  }

  renderProdutos(filtrados);
}

// Com debounce
let debounceTimer;
buscaEl.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(filtrar, 300);
});
categoriaEl.addEventListener('change', filtrar);
precoEl.addEventListener('change', filtrar);
