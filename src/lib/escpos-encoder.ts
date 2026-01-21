/**
 * ESC/POS Encoder - Professional thermal printer command generator
 * Supports most ESC/POS compatible thermal printers
 */

// Character encoding table for CP850/CP437 (common in thermal printers)
const CP850_MAP: { [key: string]: number } = {
  'á': 0xA0, 'à': 0x85, 'â': 0x83, 'ã': 0xC6, 'ä': 0x84,
  'é': 0x82, 'è': 0x8A, 'ê': 0x88, 'ë': 0x89,
  'í': 0xA1, 'ì': 0x8D, 'î': 0x8C, 'ï': 0x8B,
  'ó': 0xA2, 'ò': 0x95, 'ô': 0x93, 'õ': 0xE4, 'ö': 0x94,
  'ú': 0xA3, 'ù': 0x97, 'û': 0x96, 'ü': 0x81,
  'ç': 0x87, 'Ç': 0x80,
  'ñ': 0xA4, 'Ñ': 0xA5,
  'Á': 0xB5, 'À': 0xB7, 'Â': 0xB6, 'Ã': 0xC7, 'Ä': 0x8E,
  'É': 0x90, 'È': 0xD4, 'Ê': 0xD2, 'Ë': 0xD3,
  'Í': 0xD6, 'Ì': 0xDE, 'Î': 0xD7, 'Ï': 0xD8,
  'Ó': 0xE0, 'Ò': 0xE3, 'Ô': 0xE2, 'Õ': 0xE5, 'Ö': 0x99,
  'Ú': 0xE9, 'Ù': 0xEB, 'Û': 0xEA, 'Ü': 0x9A,
  '°': 0xF8, '²': 0xFD, '³': 0x33,
  '€': 0xEE, '£': 0x9C, '¢': 0xBD, '¥': 0x9D,
  '®': 0xAE, '©': 0xB8, '™': 0x99,
};

// ESC/POS Command constants
export const ESC = 0x1B;
export const GS = 0x1D;
export const FS = 0x1C;
export const DLE = 0x10;
export const EOT = 0x04;
export const NUL = 0x00;
export const LF = 0x0A;
export const CR = 0x0D;
export const HT = 0x09;
export const FF = 0x0C;
export const CAN = 0x18;

export type Alignment = 'left' | 'center' | 'right';
export type BarcodeType = 'UPC-A' | 'UPC-E' | 'EAN-13' | 'EAN-8' | 'CODE39' | 'ITF' | 'CODABAR' | 'CODE93' | 'CODE128';

export interface PrinterConfig {
  width?: number; // Print width in characters (default: 32 for 58mm, 48 for 80mm)
  encoding?: 'cp850' | 'cp437' | 'utf8';
  feedBeforeCut?: number;
  density?: number; // Print density 0-15 (default: 8)
}

export class ESCPOSEncoder {
  private buffer: number[] = [];
  private config: Required<PrinterConfig>;

  constructor(config?: PrinterConfig) {
    this.config = {
      width: config?.width ?? 32,
      encoding: config?.encoding ?? 'cp850',
      feedBeforeCut: config?.feedBeforeCut ?? 4,
      density: config?.density ?? 8,
    };
  }

  // Initialize printer
  init(): this {
    this.buffer.push(ESC, 0x40); // ESC @ - Initialize
    // Set print density if specified (GS ( K - Set print density)
    if (this.config.density !== 8) {
      const density = Math.min(15, Math.max(0, this.config.density));
      this.buffer.push(GS, 0x28, 0x4B, 2, 0, 0x31, density);
    }
    return this;
  }

  // Reset to default state
  reset(): this {
    this.buffer = [];
    return this.init();
  }

  // Text encoding (handles Portuguese characters)
  private encodeText(text: string): number[] {
    const result: number[] = [];
    
    for (const char of text) {
      if (char.charCodeAt(0) < 128) {
        result.push(char.charCodeAt(0));
      } else if (CP850_MAP[char] !== undefined) {
        result.push(CP850_MAP[char]);
      } else {
        // Fallback to ASCII approximation or ?
        result.push(0x3F); // '?'
      }
    }
    
    return result;
  }

  // Write raw text
  text(content: string): this {
    this.buffer.push(...this.encodeText(content));
    return this;
  }

  // Line feed
  newline(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  // Set alignment
  align(alignment: Alignment): this {
    const alignCode = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer.push(ESC, 0x61, alignCode); // ESC a n
    return this;
  }

  // Bold text
  bold(enabled = true): this {
    this.buffer.push(ESC, 0x45, enabled ? 1 : 0); // ESC E n
    return this;
  }

  // Underline
  underline(enabled = true, double = false): this {
    const mode = enabled ? (double ? 2 : 1) : 0;
    this.buffer.push(ESC, 0x2D, mode); // ESC - n
    return this;
  }

  // Invert colors (white on black)
  invert(enabled = true): this {
    this.buffer.push(GS, 0x42, enabled ? 1 : 0); // GS B n
    return this;
  }

  // Font size (1-8 for both width and height)
  size(width: number, height: number): this {
    const w = Math.min(7, Math.max(0, width - 1));
    const h = Math.min(7, Math.max(0, height - 1));
    this.buffer.push(GS, 0x21, (w << 4) | h); // GS ! n
    return this;
  }

  // Normal text mode
  normal(): this {
    this.buffer.push(ESC, 0x21, 0x00); // ESC ! 0
    return this;
  }

  // Double width
  doubleWidth(enabled = true): this {
    if (enabled) {
      this.buffer.push(ESC, 0x21, 0x20); // ESC ! 32
    } else {
      this.normal();
    }
    return this;
  }

  // Double height
  doubleHeight(enabled = true): this {
    if (enabled) {
      this.buffer.push(ESC, 0x21, 0x10); // ESC ! 16
    } else {
      this.normal();
    }
    return this;
  }

  // Double width and height
  double(enabled = true): this {
    if (enabled) {
      this.buffer.push(ESC, 0x21, 0x30); // ESC ! 48
    } else {
      this.normal();
    }
    return this;
  }

  // Print a horizontal line
  line(char = '-'): this {
    const lineChar = char.charCodeAt(0);
    for (let i = 0; i < this.config.width; i++) {
      this.buffer.push(lineChar);
    }
    return this.newline();
  }

  // Print text with padding (for receipts)
  textLine(left: string, right: string, fillChar = ' '): this {
    const leftEncoded = this.encodeText(left);
    const rightEncoded = this.encodeText(right);
    const spaces = this.config.width - leftEncoded.length - rightEncoded.length;
    
    this.buffer.push(...leftEncoded);
    for (let i = 0; i < Math.max(1, spaces); i++) {
      this.buffer.push(fillChar.charCodeAt(0));
    }
    this.buffer.push(...rightEncoded);
    return this.newline();
  }

  // Barcode
  barcode(data: string, type: BarcodeType = 'CODE128', height = 80, width = 2, showText = true): this {
    // Set barcode height
    this.buffer.push(GS, 0x68, height); // GS h n
    
    // Set barcode width (1-6)
    this.buffer.push(GS, 0x77, Math.min(6, Math.max(1, width))); // GS w n
    
    // Set HRI position (0=none, 1=above, 2=below, 3=both)
    this.buffer.push(GS, 0x48, showText ? 2 : 0); // GS H n
    
    // Set HRI font (0=A, 1=B)
    this.buffer.push(GS, 0x66, 0); // GS f n

    // Barcode type codes
    const typeCodes: { [key in BarcodeType]: number } = {
      'UPC-A': 0,
      'UPC-E': 1,
      'EAN-13': 2,
      'EAN-8': 3,
      'CODE39': 4,
      'ITF': 5,
      'CODABAR': 6,
      'CODE93': 72,
      'CODE128': 73,
    };

    // Print barcode using GS k
    const typeCode = typeCodes[type];
    if (typeCode <= 6) {
      // Old format: GS k m data NUL
      this.buffer.push(GS, 0x6B, typeCode);
      this.buffer.push(...this.encodeText(data));
      this.buffer.push(NUL);
    } else {
      // New format: GS k m n data
      this.buffer.push(GS, 0x6B, typeCode, data.length);
      
      // For CODE128, prefix with code set (123 65 = {A, 123 66 = {B, 123 67 = {C)
      if (type === 'CODE128') {
        this.buffer.push(123, 66); // {B for alphanumeric
      }
      
      this.buffer.push(...this.encodeText(data));
    }

    return this.newline();
  }

  // QR Code
  qrcode(data: string, size = 6, errorCorrection: 'L' | 'M' | 'Q' | 'H' = 'M'): this {
    const ecLevels = { L: 48, M: 49, Q: 50, H: 51 };
    
    // QR Code: Model
    this.buffer.push(GS, 0x28, 0x6B, 4, 0, 0x31, 0x41, 50, 0);
    
    // QR Code: Size
    this.buffer.push(GS, 0x28, 0x6B, 3, 0, 0x31, 0x43, Math.min(16, Math.max(1, size)));
    
    // QR Code: Error correction
    this.buffer.push(GS, 0x28, 0x6B, 3, 0, 0x31, 0x45, ecLevels[errorCorrection]);
    
    // QR Code: Store data
    const dataBytes = this.encodeText(data);
    const dataLen = dataBytes.length + 3;
    this.buffer.push(GS, 0x28, 0x6B, dataLen & 0xFF, (dataLen >> 8) & 0xFF, 0x31, 0x50, 0x30);
    this.buffer.push(...dataBytes);
    
    // QR Code: Print
    this.buffer.push(GS, 0x28, 0x6B, 3, 0, 0x31, 0x51, 0x30);

    return this.newline();
  }

  // Paper cut
  cut(partial = true): this {
    // Feed before cut
    for (let i = 0; i < this.config.feedBeforeCut; i++) {
      this.buffer.push(LF);
    }
    
    // GS V - Cut paper
    this.buffer.push(GS, 0x56, partial ? 1 : 0);
    return this;
  }

  // Feed paper (in dots, 1 dot ≈ 0.125mm)
  feed(dots = 24): this {
    this.buffer.push(ESC, 0x4A, dots); // ESC J n
    return this;
  }

  // Beep (if supported)
  beep(times = 1, duration = 100): this {
    const t = Math.min(9, Math.max(1, times));
    const d = Math.min(9, Math.max(1, Math.floor(duration / 50)));
    this.buffer.push(ESC, 0x42, t, d); // ESC B n t
    return this;
  }

  // Cash drawer kick
  cashDrawer(pin = 0): this {
    // ESC p m t1 t2
    this.buffer.push(ESC, 0x70, pin, 50, 50);
    return this;
  }

  // Get status (DLE EOT)
  getStatus(type = 1): this {
    this.buffer.push(DLE, EOT, type);
    return this;
  }

  // Select character code table
  codePage(page: number): this {
    this.buffer.push(ESC, 0x74, page); // ESC t n
    return this;
  }

  // Set line spacing
  lineSpacing(dots = 30): this {
    this.buffer.push(ESC, 0x33, dots); // ESC 3 n
    return this;
  }

  // Default line spacing
  defaultLineSpacing(): this {
    this.buffer.push(ESC, 0x32); // ESC 2
    return this;
  }

  // Raw bytes
  raw(bytes: number[] | Uint8Array): this {
    if (bytes instanceof Uint8Array) {
      this.buffer.push(...Array.from(bytes));
    } else {
      this.buffer.push(...bytes);
    }
    return this;
  }

  // Get encoded buffer as Uint8Array
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Get buffer length
  get length(): number {
    return this.buffer.length;
  }

  // Create static convenience method
  static create(config?: PrinterConfig): ESCPOSEncoder {
    return new ESCPOSEncoder(config);
  }
}

// Pre-built templates for common printing scenarios
export const PrintTemplates = {
  // Test page template
  testPage(): Uint8Array {
    return ESCPOSEncoder.create()
      .init()
      .align('center')
      .bold()
      .double()
      .text('TESTE DE IMPRESSÃO')
      .newline()
      .normal()
      .bold(false)
      .newline()
      .line('=')
      .text('Impressora ESC/POS')
      .newline()
      .text('Conectada com sucesso!')
      .newline()
      .line('-')
      .text(new Date().toLocaleString('pt-BR'))
      .newline()
      .line('=')
      .newline(2)
      .align('left')
      .text('Caracteres especiais:')
      .newline()
      .text('ÁÉÍÓÚ áéíóú çã ñ')
      .newline()
      .text('Números: 0123456789')
      .newline()
      .text('Símbolos: R$ € £ @ # %')
      .newline()
      .line('-')
      .align('center')
      .text('Sistema Nexsile Semijoias')
      .newline()
      .cut()
      .encode();
  },

  // Label template
  label(data: { 
    code: string; 
    name: string; 
    price?: number; 
    barcode?: string;
    qrcode?: string;
    qrcodeSize?: number;
  }): Uint8Array {
    const encoder = ESCPOSEncoder.create({ width: 32 })
      .init()
      .align('center');

    // QR Code if provided (at the top)
    if (data.qrcode) {
      encoder.qrcode(data.qrcode, data.qrcodeSize || 5, 'M');
    }

    // Barcode if provided
    if (data.barcode) {
      encoder.barcode(data.barcode, 'CODE128', 60, 2, false);
    }

    // Product code
    encoder
      .bold()
      .text(data.code)
      .newline()
      .bold(false);

    // Product name
    encoder.text(data.name).newline();

    // Price if provided
    if (data.price !== undefined) {
      encoder
        .double()
        .text(`R$ ${data.price.toFixed(2).replace('.', ',')}`)
        .newline()
        .normal();
    }

    return encoder.cut().encode();
  },

  // Receipt template
  receipt(data: {
    header?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    discount?: number;
    paymentMethod?: string;
    footer?: string;
  }): Uint8Array {
    const encoder = ESCPOSEncoder.create({ width: 32 }).init();

    // Header
    if (data.header) {
      encoder
        .align('center')
        .bold()
        .double()
        .text(data.header)
        .newline()
        .normal()
        .bold(false);
    }

    encoder.line('=');

    // Date/time
    encoder
      .align('center')
      .text(new Date().toLocaleString('pt-BR'))
      .newline()
      .line('-');

    // Items
    encoder.align('left');
    for (const item of data.items) {
      const qty = `${item.quantity}x`;
      const itemTotal = (item.quantity * item.price).toFixed(2);
      
      encoder
        .text(`${qty} ${item.name}`)
        .newline()
        .textLine('', `R$ ${itemTotal}`);
    }

    encoder.line('-');

    // Subtotal
    if (data.discount && data.discount > 0) {
      const subtotal = data.total + data.discount;
      encoder
        .textLine('Subtotal:', `R$ ${subtotal.toFixed(2)}`)
        .textLine('Desconto:', `-R$ ${data.discount.toFixed(2)}`);
    }

    // Total
    encoder
      .line('=')
      .align('center')
      .bold()
      .double()
      .text(`TOTAL: R$ ${data.total.toFixed(2)}`)
      .newline()
      .normal()
      .bold(false);

    // Payment method
    if (data.paymentMethod) {
      encoder
        .align('left')
        .newline()
        .text(`Pagamento: ${data.paymentMethod}`)
        .newline();
    }

    // Footer
    if (data.footer) {
      encoder
        .newline()
        .align('center')
        .text(data.footer)
        .newline();
    }

    return encoder.cut().encode();
  },
};
