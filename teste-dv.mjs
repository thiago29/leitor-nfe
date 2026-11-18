// Testes rápidos da validação/decodificação da chave (rodar: node teste-dv.mjs)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const bloco = html.slice(html.indexOf('var UF =')).split('// ::TEST:END')[0];
const fn = new Function(bloco + `; return { limparChave, dvValido, formatarChave, resumoChave };`);
const { limparChave, dvValido, formatarChave, resumoChave } = fn();

let falhas = 0;
function chk(desc, cond) {
  console.log((cond ? '✅' : '❌') + ' ' + desc);
  if (!cond) falhas++;
}

// Calcula o DV real de uma sequência de 43 dígitos (mesmo algoritmo do site).
function dvDe(sequencia) {
  let soma = 0, peso = 2;
  for (let i = 42; i >= 0; i--) { soma += Number(sequencia[i]) * peso; peso = peso === 9 ? 2 : peso + 1; }
  const resto = soma % 11;
  return String(resto === 0 || resto === 1 ? 0 : 11 - resto);
}

// Base de 43 dígitos: cUF(2)+AAMM(4)+doc(14)+modelo(2)+série(3)+número(9)+tpEmis(1)+códNum(8)
function montar(cuf, aamm, doc, modelo, serie, numero9, tpEmis, codNum8) {
  const b = cuf + aamm + doc + modelo + serie + numero9 + tpEmis + codNum8;
  if (b.length !== 43) throw new Error('base tem ' + b.length + ' dígitos: ' + b);
  return b;
}

// NF-e SP (UF 35), CNPJ emitente 14.061.913/0001-55, série 001, número 000000001
const baseCnpj = montar('35', '1709', '14061913000155', '55', '001', '000000001', '1', '00000000');
const chaveOk = baseCnpj + dvDe(baseCnpj);
console.log('chave válida gerada:', chaveOk);

chk('chave válida aceita', dvValido(chaveOk) === true);
chk('chave com DV errado rejeitada', !dvValido(baseCnpj + String((Number(dvDe(baseCnpj)) + 1) % 10)));
chk('43 dígitos rejeitados', dvValido(chaveOk.slice(0, 43)) === false);
chk('45 dígitos rejeitados', dvValido(chaveOk + '7') === false);
chk('com letra rejeitado', dvValido(chaveOk.replace('1', 'X')) === false);
chk('string vazia rejeitada', dvValido('') === false);
chk('limparChave remove espaços/pontos', limparChave(chaveOk.replace(/(.{4})/g, '$1 ').replace(/\s+$/, '').split('').map((c, i) => (i % 4 ? '' : ' ') + c).join('').trim()) === chaveOk);
chk('formatação em grupos de 4', formatarChave(chaveOk) === chaveOk.match(/.{4}/g).join(' '));

const r = Object.fromEntries(resumoChave(chaveOk));
console.log(JSON.stringify(r, null, 2));
chk('UF decodifica para SP', r.UF === 'SP');
chk('Emissão em MM/AAAA', r['Emissão'] === '09/17');
chk('CNPJ formatado', r.Emitente === '14.061.913/0001-55');
chk('Modelo "55 - NF-e"', r.Modelo === '55 - NF-e');
chk('Série sem zeros à esquerda', r.Série === '1');
chk('Número sem zeros à esquerda', r.Número === '1');
chk('DV no resumo', r.DV === chaveOk.slice(-1));

// NFC-e SP, emitente CPF 123.456.789-01 (campo com zero à esquerda), número 000000123
const baseCpf = montar('35', '1712', '00012345678901', '65', '001', '000000123', '1', '00000000');
const chaveCpf = baseCpf + dvDe(baseCpf);
const r2 = Object.fromEntries(resumoChave(chaveCpf));
console.log('emitente (CPF):', r2.Emitente);
chk('CPF formatado quando emitente começa com 0', r2.Emitente === '123.456.789-01');
chk('Modelo "65 - NFC-e"', r2.Modelo === '65 - NFC-e');
chk('Número decodificado (sem zeros à esquerda)', r2.Número === '123');
chk('chave do emitente-CPF valida', dvValido(chaveCpf) === true);

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO OK');
process.exit(falhas ? 1 : 0);
