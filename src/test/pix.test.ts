import { describe, it, expect } from "vitest";
import { generatePixPayload, formatPixKey } from "@/lib/pix-generator";

/**
 * Substitui parte de `hooks-isolation.test.ts`, que testava mocks locais.
 *
 * O gerador de PIX é código puro que move dinheiro de verdade: o payload vira
 * o QR Code que o cliente lê para pagar. Um CRC errado ou um campo com
 * comprimento errado faz o app do banco recusar a leitura — falha que só
 * aparece com o cliente na frente do balcão.
 */

/** Percorre o payload EMV e devolve os campos de primeiro nível. */
function lerCampos(payload: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < payload.length - 4) {
    const id = payload.slice(i, i + 2);
    const tam = parseInt(payload.slice(i + 2, i + 4), 10);
    campos[id] = payload.slice(i + 4, i + 4 + tam);
    i += 4 + tam;
  }
  return campos;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const base = {
  chave: "12345678909",
  nome: "LOJA NEXSILES",
  cidade: "SAO PAULO",
  tipo: "cpf" as const,
};

describe("generatePixPayload", () => {
  it("termina com um CRC16 que confere com o restante do payload", () => {
    const payload = generatePixPayload({ ...base, valor: 199.9 });

    // O CRC cobre tudo até "6304" inclusive.
    const semCrc = payload.slice(0, -4);
    expect(semCrc.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(crc16(semCrc));
  });

  it("declara o comprimento correto em cada campo", () => {
    const payload = generatePixPayload({ ...base, valor: 50 });
    const campos = lerCampos(payload);

    // Se algum comprimento estivesse errado, o parser sairia do trilho e não
    // acharia o campo obrigatório de payload format indicator.
    expect(campos["00"]).toBe("01");
    expect(campos["58"]).toBe("BR");
  });

  it("grava o valor com duas casas decimais", () => {
    const campos = lerCampos(generatePixPayload({ ...base, valor: 1234.5 }));
    expect(campos["54"]).toBe("1234.50");
  });

  it("omite o campo de valor quando a cobrança é sem valor definido", () => {
    const campos = lerCampos(generatePixPayload(base));
    expect(campos["54"]).toBeUndefined();
  });

  it("remove acentos do nome e da cidade", () => {
    const payload = generatePixPayload({
      ...base,
      nome: "JOÃO JOALHERIA",
      cidade: "SÃO JOSÉ",
    });

    // Acento no payload faz o app do banco recusar a leitura.
    expect(payload).not.toMatch(/[ÀÁÂÃÄÇÉÊÍÓÔÕÚàáâãäçéêíóôõú]/);
    expect(payload).toContain("JOAO JOALHERIA");
  });

  it("mantém o CRC válido mesmo com valor alto e txid", () => {
    const payload = generatePixPayload({
      ...base,
      valor: 99999.99,
      txid: "PEDIDO123",
    });
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });
});

describe("formatPixKey", () => {
  it("formata CPF com pontuação", () => {
    expect(formatPixKey("12345678909", "cpf")).toBe("123.456.789-09");
  });

  it("devolve a chave sem alteração quando o tipo não tem máscara", () => {
    expect(formatPixKey("loja@nexsiles.com.br", "email")).toBe("loja@nexsiles.com.br");
  });
});
