// popup.js — ColorPick Pro
'use strict';

// ═══════════════════════════════════════════════════
// COLOR CONVERTER — all math, no external libraries
// ═══════════════════════════════════════════════════
const ColorConverter = {

  toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  },

  toRgb(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
  },

  toRgbNorm(r, g, b) {
    return `rgb(${(r / 255).toFixed(4)}, ${(g / 255).toFixed(4)}, ${(b / 255).toFixed(4)})`;
  },

  _rgbToHslVals(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  toHsl(r, g, b) {
    const { h, s, l } = this._rgbToHslVals(r, g, b);
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  },

  hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    };
    return { r: f(0), g: f(8), b: f(4) };
  },

  hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  },

  // sRGB → Linear sRGB
  _linearize(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  },

  // Full OKLCH pipeline: sRGB → Linear → XYZ D65 → OKLab → OKLCH
  toOklch(r, g, b) {
    const rl = this._linearize(r), gl = this._linearize(g), bl = this._linearize(b);

    // Linear sRGB → XYZ D65
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

    // XYZ → LMS (Oklab M1 matrix)
    const lm =  0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
    const mm =  0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
    const sm =  0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z;

    // Cube root
    const cbrt = v => Math.sign(v) * Math.pow(Math.abs(v), 1 / 3);
    const l_ = cbrt(lm), m_ = cbrt(mm), s_ = cbrt(sm);

    // LMS → OKLab (M2 matrix)
    const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const bk =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    // OKLab → OKLCH
    const C = Math.sqrt(a * a + bk * bk);
    let H = Math.atan2(bk, a) * (180 / Math.PI);
    if (H < 0) H += 360;

    return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${H.toFixed(2)})`;
  },

  toOklchValues(r, g, b) {
    const rl = this._linearize(r), gl = this._linearize(g), bl = this._linearize(b);
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
    const lm = 0.8189330101*X + 0.3618667424*Y - 0.1288597137*Z;
    const mm = 0.0329845436*X + 0.9293118715*Y + 0.0361456387*Z;
    const sm = 0.0482003018*X + 0.2643662691*Y + 0.6338517070*Z;
    const cbrt = v => Math.sign(v) * Math.pow(Math.abs(v), 1/3);
    const l_ = cbrt(lm), m_ = cbrt(mm), s_ = cbrt(sm);
    const L  = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
    const a  = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
    const bk = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
    const C = Math.sqrt(a * a + bk * bk);
    let H = Math.atan2(bk, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    return { l: L * 100, c: C, h: H };
  }
};

// ═══════════════════════════════════════════════════
// FEATURE 2: CSS COLOR NAMES
// ═══════════════════════════════════════════════════
const ColorNames = (function(){
  const d=[['aliceblue',240,248,255],['antiquewhite',250,235,215],['aqua',0,255,255],['aquamarine',127,255,212],['azure',240,255,255],['beige',245,245,220],['bisque',255,228,196],['black',0,0,0],['blanchedalmond',255,235,205],['blue',0,0,255],['blueviolet',138,43,226],['brown',165,42,42],['burlywood',222,184,135],['cadetblue',95,158,160],['chartreuse',127,255,0],['chocolate',210,105,30],['coral',255,127,80],['cornflowerblue',100,149,237],['cornsilk',255,248,220],['crimson',220,20,60],['cyan',0,255,255],['darkblue',0,0,139],['darkcyan',0,139,139],['darkgoldenrod',184,134,11],['darkgray',169,169,169],['darkgreen',0,100,0],['darkkhaki',189,183,107],['darkmagenta',139,0,139],['darkolivegreen',85,107,47],['darkorange',255,140,0],['darkorchid',153,50,204],['darkred',139,0,0],['darksalmon',233,150,122],['darkseagreen',143,188,143],['darkslateblue',72,61,139],['darkslategray',47,79,79],['darkturquoise',0,206,209],['darkviolet',148,0,211],['deeppink',255,20,147],['deepskyblue',0,191,255],['dimgray',105,105,105],['dodgerblue',30,144,255],['firebrick',178,34,34],['floralwhite',255,250,240],['forestgreen',34,139,34],['fuchsia',255,0,255],['gainsboro',220,220,220],['ghostwhite',248,248,255],['gold',255,215,0],['goldenrod',218,165,32],['gray',128,128,128],['green',0,128,0],['greenyellow',173,255,47],['honeydew',240,255,240],['hotpink',255,105,180],['indianred',205,92,92],['indigo',75,0,130],['ivory',255,255,240],['khaki',240,230,140],['lavender',230,230,250],['lavenderblush',255,240,245],['lawngreen',124,252,0],['lemonchiffon',255,250,205],['lightblue',173,216,230],['lightcoral',240,128,128],['lightcyan',224,255,255],['lightgoldenrodyellow',250,250,210],['lightgray',211,211,211],['lightgreen',144,238,144],['lightpink',255,182,193],['lightsalmon',255,160,122],['lightseagreen',32,178,170],['lightskyblue',135,206,250],['lightslategray',119,136,153],['lightsteelblue',176,196,222],['lightyellow',255,255,224],['lime',0,255,0],['limegreen',50,205,50],['linen',250,240,230],['magenta',255,0,255],['maroon',128,0,0],['mediumaquamarine',102,205,170],['mediumblue',0,0,205],['mediumorchid',186,85,211],['mediumpurple',147,112,219],['mediumseagreen',60,179,113],['mediumslateblue',123,104,238],['mediumspringgreen',0,250,154],['mediumturquoise',72,209,204],['mediumvioletred',199,21,133],['midnightblue',25,25,112],['mintcream',245,255,250],['mistyrose',255,228,225],['moccasin',255,228,181],['navajowhite',255,222,173],['navy',0,0,128],['oldlace',253,245,230],['olive',128,128,0],['olivedrab',107,142,35],['orange',255,165,0],['orangered',255,69,0],['orchid',218,112,214],['palegoldenrod',238,232,170],['palegreen',152,251,152],['paleturquoise',175,238,238],['palevioletred',219,112,147],['papayawhip',255,239,213],['peachpuff',255,218,185],['peru',205,133,63],['pink',255,192,203],['plum',221,160,221],['powderblue',176,224,230],['purple',128,0,128],['red',255,0,0],['rosybrown',188,143,143],['royalblue',65,105,225],['saddlebrown',139,69,19],['salmon',250,128,114],['sandybrown',244,164,96],['seagreen',46,139,87],['seashell',255,245,238],['sienna',160,82,45],['silver',192,192,192],['skyblue',135,206,235],['slateblue',106,90,205],['slategray',112,128,144],['snow',255,250,250],['springgreen',0,255,127],['steelblue',70,130,180],['tan',210,180,140],['teal',0,128,128],['thistle',216,191,216],['tomato',255,99,71],['turquoise',64,224,208],['violet',238,130,238],['wheat',245,222,179],['white',255,255,255],['whitesmoke',245,245,245],['yellow',255,255,0],['yellowgreen',154,205,50]];
  return {
    findNearest(r,g,b){
      let best=d[0][0],bd=Infinity;
      for(const[n,cr,cg,cb] of d){const dd=(r-cr)**2+(g-cg)**2+(b-cb)**2;if(dd<bd){bd=dd;best=n;}}
      return best.charAt(0).toUpperCase()+best.slice(1);
    }
  };
})();

// ═══════════════════════════════════════════════════
// FEATURE 7: TAILWIND COLOR LOOKUP
// ═══════════════════════════════════════════════════
const TailwindColors = (function(){
  const h2=[['slate-50','#f8fafc'],['slate-100','#f1f5f9'],['slate-200','#e2e8f0'],['slate-300','#cbd5e1'],['slate-400','#94a3b8'],['slate-500','#64748b'],['slate-600','#475569'],['slate-700','#334155'],['slate-800','#1e293b'],['slate-900','#0f172a'],['gray-50','#f9fafb'],['gray-100','#f3f4f6'],['gray-200','#e5e7eb'],['gray-300','#d1d5db'],['gray-400','#9ca3af'],['gray-500','#6b7280'],['gray-600','#4b5563'],['gray-700','#374151'],['gray-800','#1f2937'],['gray-900','#111827'],['red-50','#fef2f2'],['red-100','#fee2e2'],['red-200','#fecaca'],['red-300','#fca5a5'],['red-400','#f87171'],['red-500','#ef4444'],['red-600','#dc2626'],['red-700','#b91c1c'],['red-800','#991b1b'],['red-900','#7f1d1d'],['orange-50','#fff7ed'],['orange-100','#ffedd5'],['orange-200','#fed7aa'],['orange-300','#fdba74'],['orange-400','#fb923c'],['orange-500','#f97316'],['orange-600','#ea580c'],['orange-700','#c2410c'],['orange-800','#9a3412'],['orange-900','#7c2d12'],['yellow-50','#fefce8'],['yellow-100','#fef9c3'],['yellow-200','#fef08a'],['yellow-300','#fde047'],['yellow-400','#facc15'],['yellow-500','#eab308'],['yellow-600','#ca8a04'],['yellow-700','#a16207'],['yellow-800','#854d0e'],['yellow-900','#713f12'],['green-50','#f0fdf4'],['green-100','#dcfce7'],['green-200','#bbf7d0'],['green-300','#86efac'],['green-400','#4ade80'],['green-500','#22c55e'],['green-600','#16a34a'],['green-700','#15803d'],['green-800','#166534'],['green-900','#14532d'],['blue-50','#eff6ff'],['blue-100','#dbeafe'],['blue-200','#bfdbfe'],['blue-300','#93c5fd'],['blue-400','#60a5fa'],['blue-500','#3b82f6'],['blue-600','#2563eb'],['blue-700','#1d4ed8'],['blue-800','#1e40af'],['blue-900','#1e3a8a'],['indigo-50','#eef2ff'],['indigo-100','#e0e7ff'],['indigo-200','#c7d2fe'],['indigo-300','#a5b4fc'],['indigo-400','#818cf8'],['indigo-500','#6366f1'],['indigo-600','#4f46e5'],['indigo-700','#4338ca'],['indigo-800','#3730a3'],['indigo-900','#312e81'],['violet-50','#f5f3ff'],['violet-100','#ede9fe'],['violet-200','#ddd6fe'],['violet-300','#c4b5fd'],['violet-400','#a78bfa'],['violet-500','#8b5cf6'],['violet-600','#7c3aed'],['violet-700','#6d28d9'],['violet-800','#5b21b6'],['violet-900','#4c1d95'],['pink-50','#fdf2f8'],['pink-100','#fce7f3'],['pink-200','#fbcfe8'],['pink-300','#f9a8d4'],['pink-400','#f472b6'],['pink-500','#ec4899'],['pink-600','#db2777'],['pink-700','#be185d'],['pink-800','#9d174d'],['pink-900','#831843'],['teal-50','#f0fdfa'],['teal-100','#ccfbf1'],['teal-200','#99f6e4'],['teal-300','#5eead4'],['teal-400','#2dd4bf'],['teal-500','#14b8a6'],['teal-600','#0d9488'],['teal-700','#0f766e'],['teal-800','#115e59'],['teal-900','#134e4a'],['cyan-50','#ecfeff'],['cyan-100','#cffafe'],['cyan-200','#a5f3fc'],['cyan-300','#67e8f9'],['cyan-400','#22d3ee'],['cyan-500','#06b6d4'],['cyan-600','#0891b2'],['cyan-700','#0e7490'],['cyan-800','#155e75'],['cyan-900','#164e63'],['purple-50','#faf5ff'],['purple-100','#f3e8ff'],['purple-200','#e9d5ff'],['purple-300','#d8b4fe'],['purple-400','#c084fc'],['purple-500','#a855f7'],['purple-600','#9333ea'],['purple-700','#7e22ce'],['purple-800','#6b21a8'],['purple-900','#581c87'],['rose-50','#fff1f2'],['rose-100','#ffe4e6'],['rose-200','#fecdd3'],['rose-300','#fda4af'],['rose-400','#fb7185'],['rose-500','#f43f5e'],['rose-600','#e11d48'],['rose-700','#be123c'],['rose-800','#9f1239'],['rose-900','#881337']];
  const p=v=>parseInt(v,16);
  const data=h2.map(([n,h])=>[n,p(h.slice(1,3)),p(h.slice(3,5)),p(h.slice(5,7))]);
  return {
    findNearest(r,g,b){
      let best=data[0][0],bd=Infinity;
      for(const[n,cr,cg,cb] of data){const dd=(r-cr)**2+(g-cg)**2+(b-cb)**2;if(dd<bd){bd=dd;best=n;}}
      return best;
    }
  };
})();

// ═══════════════════════════════════════════════════
// FEATURE 14: PANTONE & RAL LOOKUP
// ═══════════════════════════════════════════════════
const PantoneData=[['032 C',255,50,50],['072 C',16,6,159],['109 C',255,213,0],['1345 C',255,198,139],['1375 C',255,163,0],['1485 C',255,143,51],['1495 C',255,127,17],['1505 C',251,95,0],['1525 C',210,73,42],['1535 C',185,55,28],['1545 C',122,27,13],['1555 C',243,172,130],['1565 C',249,148,84],['1575 C',248,122,44],['1585 C',244,99,7],['1595 C',214,88,10],['1605 C',178,71,16],['1615 C',148,57,11],['165 C',255,104,31],['1655 C',255,89,26],['1665 C',234,77,21],['1675 C',195,64,24],['1685 C',165,53,22],['1765 C',255,162,176],['1775 C',255,133,154],['1785 C',255,82,106],['1795 C',220,50,66],['1805 C',186,24,44],['1815 C',148,13,28],['185 C',213,43,30],['1865 C',255,171,180],['1875 C',255,147,163],['1885 C',255,115,135],['1895 C',255,88,113],['1905 C',243,56,87],['1915 C',213,36,67],['192 C',227,27,35],['193 C',199,38,57],['194 C',151,23,41],['195 C',116,11,28],['202 C',152,50,64],['204 C',234,86,117],['205 C',243,117,148],['206 C',224,60,102],['207 C',195,44,96],['208 C',156,29,73],['209 C',126,22,60],['210 C',255,138,185],['211 C',255,111,170],['212 C',255,82,152]];
const RALData=[['1000','Green beige',190,189,127],['1001','Beige',205,186,136],['1002','Sand yellow',206,184,112],['1003','Signal yellow',255,214,0],['1004','Golden yellow',221,181,0],['1005','Honey yellow',202,164,0],['1006','Maize yellow',228,177,0],['1007','Daffodil yellow',233,175,0],['1011','Brown beige',171,129,79],['1012','Lemon yellow',221,196,0],['1013','Oyster white',229,220,194],['1014','Ivory',219,209,179],['1015','Light ivory',230,225,201],['1016','Sulfur yellow',241,221,56],['1017','Saffron yellow',246,182,90],['1018','Zinc yellow',250,210,0],['1019','Grey beige',160,143,120],['1020','Olive yellow',155,148,83],['2000','Yellow orange',218,120,0],['2001','Red orange',186,71,33],['2002','Vermilion',193,65,28],['2003','Pastel orange',255,126,0],['2004','Pure orange',232,93,0],['2005','Luminous orange',255,77,0],['3000','Flame red',162,35,29],['3001','Signal red',162,35,29],['3002','Carmine red',162,35,29],['3003','Ruby red',139,14,14],['3004','Purple red',110,14,14],['3005','Wine red',90,11,17],['5000','Violet blue',33,69,104],['5001','Green blue',25,73,93],['5002','Ultramarine blue',0,50,131],['5003','Sapphire blue',15,58,96],['5004','Black blue',12,20,37],['5005','Signal blue',0,83,135],['6000','Patina green',49,102,80],['6001','Emerald green',45,93,58],['6002','Leaf green',36,94,41],['6003','Olive green',80,89,55],['6004','Blue green',13,73,66]];

function findNearestPantone(r,g,b){let best=PantoneData[0],bd=Infinity;for(const p of PantoneData){const d=(r-p[1])**2+(g-p[2])**2+(b-p[3])**2;if(d<bd){bd=d;best=p;}}return best[0];}
function findNearestRAL(r,g,b){let best=RALData[0],bd=Infinity;for(const p of RALData){const d=(r-p[2])**2+(g-p[3])**2+(b-p[4])**2;if(d<bd){bd=d;best=p;}}return best[0];}
// ═══════════════════════════════════════════════════
const WCAGChecker = {
  _luminance(r, g, b) {
    const lin = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  },

  ratio(c1, c2) {
    const l1 = this._luminance(c1.r, c1.g, c1.b);
    const l2 = this._luminance(c2.r, c2.g, c2.b);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  evaluate(ratio) {
    return {
      aa:     ratio >= 4.5,
      aaa:    ratio >= 7.0,
      aaLg:   ratio >= 3.0,
      aaaLg:  ratio >= 4.5
    };
  }
};

// ═══════════════════════════════════════════════════
// THEME GENERATOR
// ═══════════════════════════════════════════════════
const ThemeGenerator = {
  _mix(c, target, t) {
    return {
      r: Math.round(c.r + (target - c.r) * t),
      g: Math.round(c.g + (target - c.g) * t),
      b: Math.round(c.b + (target - c.b) * t)
    };
  },

  generate(r, g, b) {
    const base = { r, g, b };
    const { h, s, l } = ColorConverter._rgbToHslVals(r, g, b);

    // Tints: mix toward white
    const tints = [0.15, 0.35, 0.55, 0.72, 0.87].map(t =>
      this._mix(base, 255, t)
    );

    // Shades: mix toward black
    const shades = [0.85, 0.65, 0.45, 0.28, 0.13].map(t =>
      this._mix(base, 0, 1 - t)
    );

    // Harmonies via HSL
    const harmony = (dh) => ColorConverter.hslToRgb(((h + dh) % 360 + 360) % 360, s, l);

    return {
      type: 'harmony',
      base,
      tints,
      shades,
      complementary: [harmony(180)],
      triadic:        [harmony(120), harmony(240)],
      analogous:      [harmony(-30), harmony(30), harmony(60)],
      splitComp:      [harmony(150), harmony(210)]
    };
  },

  toCssVars(palette, name = 'color') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    if (palette.type === 'mono') {
      const lines = [':root {'];
      palette.scale.forEach((c, i) => lines.push(`  --${name}-${(i + 1) * 100}: ${hex(c)};`));
      lines.push('}');
      return lines.join('\n');
    }
    if (palette.type === 'duotone') {
      const lines = [':root {'];
      palette.blend.forEach((c, i) => lines.push(`  --${name}-blend-${i}: ${hex(c)};`));
      lines.push('}');
      return lines.join('\n');
    }
    if (palette.type === 'material') {
      const lines = [':root {'];
      palette.scale.forEach(c => lines.push(`  --${name}-${c.step}: ${hex(c)};`));
      lines.push('}');
      return lines.join('\n');
    }
    // harmony
    const lines = [':root {', `  --${name}: ${hex(palette.base)};`];
    palette.tints.forEach((c, i) =>  lines.push(`  --${name}-${100 + i * 100}: ${hex(c)};`));
    // Insert base at 500
    lines.splice(7, 0, `  --${name}-500: ${hex(palette.base)};`);
    palette.shades.forEach((c, i) => lines.push(`  --${name}-${600 + i * 100}: ${hex(c)};`));
    palette.complementary.forEach(c => lines.push(`  --${name}-complementary: ${hex(c)};`));
    palette.triadic.forEach((c, i) => lines.push(`  --${name}-triadic-${i + 1}: ${hex(c)};`));
    palette.analogous.forEach((c, i) => lines.push(`  --${name}-analogous-${i + 1}: ${hex(c)};`));
    lines.push('}');
    return lines.join('\n');
  },

  toTailwindConfig(palette, name = 'brand') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    if (palette.type === 'mono') {
      const entries = [`  ${name}: {`, ...palette.scale.map((c, i) => `    '${(i + 1) * 100}': '${hex(c)}',`), '  }'];
      return `// tailwind.config.js → theme.extend.colors\n{\n${entries.join('\n')}\n}`;
    }
    if (palette.type === 'duotone') {
      const entries = [`  ${name}: {`, ...palette.blend.map((c, i) => `    'blend-${i}': '${hex(c)}',`), '  }'];
      return `// tailwind.config.js → theme.extend.colors\n{\n${entries.join('\n')}\n}`;
    }
    if (palette.type === 'material') {
      const entries = [`  ${name}: {`, ...palette.scale.map(c => `    '${c.step}': '${hex(c)}',`), '  }'];
      return `// tailwind.config.js → theme.extend.colors\n{\n${entries.join('\n')}\n}`;
    }
    // harmony
    const entries = [
      `  ${name}: {`,
      ...palette.tints.map((c, i) => `    '${(i + 1) * 100}': '${hex(c)}',`),
      `    '500': '${hex(palette.base)}',`,
      ...palette.shades.map((c, i) => `    '${600 + i * 100}': '${hex(c)}',`),
      '  }'
    ];
    return `// tailwind.config.js → theme.extend.colors\n{\n${entries.join('\n')}\n}`;
  },

  toScss(palette, name = 'color') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    const lines = ['// Generated by ColorPick Pro'];
    if (palette.type === 'mono') {
      palette.scale.forEach((c, i) => lines.push(`$${name}-${(i + 1) * 100}: ${hex(c)};`));
    } else if (palette.type === 'duotone') {
      palette.blend.forEach((c, i) => lines.push(`$${name}-blend-${i}: ${hex(c)};`));
    } else if (palette.type === 'material') {
      palette.scale.forEach(c => lines.push(`$${name}-${c.step}: ${hex(c)};`));
    } else {
      palette.tints.forEach((c, i) => lines.push(`$${name}-${100 + i * 100}: ${hex(c)};`));
      lines.push(`$${name}-500: ${hex(palette.base)};`);
      palette.shades.forEach((c, i) => lines.push(`$${name}-${600 + i * 100}: ${hex(c)};`));
      lines.push(`$${name}-base: ${hex(palette.base)};`);
      if (palette.complementary && palette.complementary.length) {
        lines.push(`$${name}-complementary: ${hex(palette.complementary[0])};`);
      }
    }
    return lines.join('\n');
  },

  toJsonTokens(palette, name = 'color') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    const tokens = {};
    if (palette.type === 'mono') {
      palette.scale.forEach((c, i) => { tokens[String((i + 1) * 100)] = { '$value': hex(c), '$type': 'color' }; });
    } else if (palette.type === 'duotone') {
      palette.blend.forEach((c, i) => { tokens[`blend-${i}`] = { '$value': hex(c), '$type': 'color' }; });
    } else if (palette.type === 'material') {
      palette.scale.forEach(c => { tokens[String(c.step)] = { '$value': hex(c), '$type': 'color' }; });
    } else {
      palette.tints.forEach((c, i) => { tokens[String(100 + i * 100)] = { '$value': hex(c), '$type': 'color' }; });
      tokens['500'] = { '$value': hex(palette.base), '$type': 'color' };
      palette.shades.forEach((c, i) => { tokens[String(600 + i * 100)] = { '$value': hex(c), '$type': 'color' }; });
      if (palette.complementary && palette.complementary.length) {
        tokens['complementary'] = { '$value': hex(palette.complementary[0]), '$type': 'color' };
      }
    }
    return JSON.stringify({ [name]: tokens }, null, 2);
  },

  toFigmaTokens(palette, name = 'color') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    const tokens = {};
    if (palette.type === 'mono') {
      palette.scale.forEach((c, i) => { tokens[`${name}-${(i + 1) * 100}`] = { value: hex(c), type: 'color' }; });
    } else if (palette.type === 'duotone') {
      palette.blend.forEach((c, i) => { tokens[`${name}-blend-${i}`] = { value: hex(c), type: 'color' }; });
    } else if (palette.type === 'material') {
      palette.scale.forEach(c => { tokens[`${name}-${c.step}`] = { value: hex(c), type: 'color' }; });
    } else {
      palette.tints.forEach((c, i) => { tokens[`${name}-${100 + i * 100}`] = { value: hex(c), type: 'color' }; });
      tokens[`${name}-500`] = { value: hex(palette.base), type: 'color' };
      palette.shades.forEach((c, i) => { tokens[`${name}-${600 + i * 100}`] = { value: hex(c), type: 'color' }; });
      if (palette.complementary && palette.complementary.length) {
        tokens[`${name}-complementary`] = { value: hex(palette.complementary[0]), type: 'color' };
      }
    }
    return JSON.stringify({ global: tokens }, null, 2);
  }
};

// ═══════════════════════════════════════════════════
// EXPORT MANAGER
// ═══════════════════════════════════════════════════
const ExportManager = {
  blocks(r, g, b) {
    const hex    = ColorConverter.toHex(r, g, b);
    const rgb    = ColorConverter.toRgb(r, g, b);
    const hsl    = ColorConverter.toHsl(r, g, b);
    const oklch  = ColorConverter.toOklch(r, g, b);

    return [
      {
        title: 'CSS Variable',
        content: `--color-primary: ${hex};\n--color-primary-rgb: ${r}, ${g}, ${b};\n--color-primary-hsl: ${hsl};`
      },
      {
        title: 'OKLCH (CSS Color Level 4)',
        content: `color: ${oklch};\n/* Background use */\nbackground-color: ${oklch};`
      },
      {
        title: 'Tailwind',
        content: `// tailwind.config.js\nprimary: {\n  DEFAULT: '${hex}',\n}`
      },
      {
        title: 'All Formats',
        content: `${hex}\n${rgb}\n${hsl}\n${oklch}`
      },
      {
        title: 'iOS (Swift)',
        content: `UIColor(red: ${(r/255).toFixed(3)}, green: ${(g/255).toFixed(3)}, blue: ${(b/255).toFixed(3)}, alpha: 1.0)`
      },
      {
        title: 'Android (Kotlin)',
        content: `Color(0xFF${hex.slice(1).toUpperCase()})\ncolorResource = R.color.primary`
      }
    ];
  },

  allText(r, g, b) {
    const hex   = ColorConverter.toHex(r, g, b);
    const rgb   = ColorConverter.toRgb(r, g, b);
    const norm  = ColorConverter.toRgbNorm(r, g, b);
    const hsl   = ColorConverter.toHsl(r, g, b);
    const oklch = ColorConverter.toOklch(r, g, b);
    return `/* ColorPick Pro — Exported Color */
/* ${hex} */

:root {
  --color-primary: ${hex};
  --color-primary-rgb: ${r}, ${g}, ${b};
  --color-primary-normalized: ${norm};
  --color-primary-hsl: ${hsl};
  --color-primary-oklch: ${oklch};
}

.element {
  color: ${hex};
  color: ${rgb};
  color: ${hsl};
  color: ${oklch};
}`;
  }
};

// ═══════════════════════════════════════════════════
// APP STATE + DOM REFS
// ═══════════════════════════════════════════════════
let currentColor = { r: 139, g: 92, b: 246 };
let colorHistory = [];
let themePalette = null;
let themePaletteBase = null;
let themeMode = 'harmony';
let themeHueShift = 0;
let themeSatAdj = 0;
let themeLightAdj = 0;
let lockedSwatches = new Set();
let themePresets = [];
let isDarkMode   = true;
let pinnedColors  = [];
let palettes      = [];
let gradStops     = [];
let exportVarName = '--color-primary';
// Feature 3: alpha state
let currentAlpha = 1.0;
// Feature 9: history navigation index
let historyIndex = -1;
// Feature 4: compare state
let compareColorB = { r: 255, g: 255, b: 255 };

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════
// THEME (LIGHT / DARK)
// ═══════════════════════════════════════════════════
function applyTheme(dark) {
  isDarkMode = dark;
  document.documentElement.classList.toggle('light', !dark);
}

function toggleTheme() {
  applyTheme(!isDarkMode);
  chrome.storage.local.set({ uiTheme: isDarkMode ? 'dark' : 'light' });
}

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Load persisted data
  const data = await chrome.storage.local.get(['pendingColor', 'colorHistory', 'uiTheme', 'pinnedColors', 'palettes', 'exportVarName', 'themePresets']);

  // Apply saved theme (default: dark)
  applyTheme(data.uiTheme !== 'light');

  if (data.pendingColor) {
    currentColor = data.pendingColor;
    // Clear badge and pending after reading
    chrome.storage.local.remove('pendingColor');
    chrome.action.setBadgeText({ text: '' }).catch(() => {});
  }

  colorHistory = data.colorHistory || [];
  pinnedColors  = data.pinnedColors || [];
  palettes      = data.palettes     || [];
  themePresets  = data.themePresets || [];
  if (data.exportVarName) {
    exportVarName = data.exportVarName;
    $('exportVarName').value = exportVarName;
  }

  // Initial renders
  updateColorDisplay(currentColor);
  renderHistory();
  initWcag();
  initTheme();
  renderExport();
  renderPaletteCollections();
  initGradientBuilder();
  updateColorBlindness();
  renderThemePresets();

  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Theme toggle
  $('btnThemeToggle').addEventListener('click', toggleTheme);

  // Pick button
  $('btnPick').addEventListener('click', startPicking);

  // Hero copy hex button
  $('btnCopyHex').addEventListener('click', () => {
    const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
    copyText(hex.toUpperCase(), $('btnCopyHex'));
  });

  // Swatch color input (manual color picker)
  $('swatchColorInput').addEventListener('input', e => {
    const rgb = ColorConverter.hexToRgb(e.target.value);
    if (rgb) {
      currentColor = rgb;
      updateColorDisplay(rgb);
    }
  });
  $('swatchColorInput').addEventListener('change', e => {
    const rgb = ColorConverter.hexToRgb(e.target.value);
    if (rgb) {
      colorHistory.unshift(rgb);
      if (colorHistory.length > 20) colorHistory.pop();
      chrome.storage.local.set({ colorHistory });
      renderHistory();
    }
  });

  // Copy buttons (format rows)
  document.querySelectorAll('.btn-copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = $(btn.dataset.copy);
      if (el) copyText(el.textContent.trim(), btn);
    });
  });

  // History clear
  $('btnClearHistory').addEventListener('click', clearHistory);

  // WCAG controls
  $('fgColor').addEventListener('input', e => syncColorField('fg', e.target.value));
  $('bgColor').addEventListener('input', e => syncColorField('bg', e.target.value));
  $('fgHex').addEventListener('input',  e => syncHexField('fg', e.target.value));
  $('bgHex').addEventListener('input',  e => syncHexField('bg', e.target.value));
  $('btnSwapColors').addEventListener('click', swapContrastColors);

  // Theme generator
  $('themeBase').addEventListener('input',    e => syncThemeField('base', e.target.value));
  $('themeBaseHex').addEventListener('input', e => syncThemeHexField(e.target.value));
  $('btnGenTheme').addEventListener('click',  generateTheme);
  $('btnCopyTheme').addEventListener('click', copyThemeCss);
  $('btnCopyTailwind').addEventListener('click', copyThemeTailwind);

  // Theme mode buttons
  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      themeMode = btn.dataset.mode;
      document.querySelectorAll('.theme-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      const duoRow = $('duotoneColorRow');
      if (duoRow) duoRow.style.display = themeMode === 'duotone' ? '' : 'none';
      // Initialize second color to complement of base when switching to duotone
      if (themeMode === 'duotone') {
        const rgb = ColorConverter.hexToRgb($('themeBase').value);
        if (rgb) {
          const { h, s, l } = ColorConverter._rgbToHslVals(rgb.r, rgb.g, rgb.b);
          const comp = ColorConverter.hslToRgb((h + 180) % 360, s, l);
          const compHex = ColorConverter.toHex(comp.r, comp.g, comp.b);
          $('themeBase2').value    = compHex;
          $('themeBaseHex2').value = compHex;
        }
      }
      generateTheme();
    });
  });

  // Duotone second color inputs
  $('themeBase2').addEventListener('input',    e => { $('themeBaseHex2').value = e.target.value; generateTheme(); });
  $('themeBaseHex2').addEventListener('input', e => {
    const clean = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
    const rgb = ColorConverter.hexToRgb(clean);
    if (rgb) { $('themeBase2').value = clean; generateTheme(); }
  });

  // Adjust sliders
  $('themeHueSlider').addEventListener('input', e => {
    themeHueShift = parseInt(e.target.value);
    const sign = themeHueShift > 0 ? '+' : '';
    $('themeHueVal').textContent = sign + themeHueShift + '°';
    if (themePaletteBase) renderThemePalette(themePaletteBase);
  });
  $('themeSatSlider').addEventListener('input', e => {
    themeSatAdj = parseInt(e.target.value);
    const sign = themeSatAdj > 0 ? '+' : '';
    $('themeSatVal').textContent = sign + themeSatAdj;
    if (themePaletteBase) renderThemePalette(themePaletteBase);
  });
  $('themeLightSlider').addEventListener('input', e => {
    themeLightAdj = parseInt(e.target.value);
    const sign = themeLightAdj > 0 ? '+' : '';
    $('themeLightVal').textContent = sign + themeLightAdj;
    if (themePaletteBase) renderThemePalette(themePaletteBase);
  });
  $('btnThemeAdjReset').addEventListener('click', () => {
    themeHueShift = 0; themeSatAdj = 0; themeLightAdj = 0;
    $('themeHueSlider').value = 0;   $('themeHueVal').textContent = '0°';
    $('themeSatSlider').value = 0;   $('themeSatVal').textContent = '0';
    $('themeLightSlider').value = 0; $('themeLightVal').textContent = '0';
    if (themePaletteBase) renderThemePalette(themePaletteBase);
  });

  // Adjust panel toggle
  $('themeAdjToggle').addEventListener('click', () => {
    const content = $('themeAdjContent');
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? '' : 'none';
    $('themeAdjToggle').textContent = isHidden ? '▾ Hide' : '▸ Show';
  });

  // Presets
  $('btnSaveThemePreset').addEventListener('click', saveThemePreset);

  // New export buttons
  $('btnCopyScss').addEventListener('click',        copyThemeScss);
  $('btnCopyJsonTokens').addEventListener('click',  copyThemeJsonTokens);
  $('btnCopyFigmaTokens').addEventListener('click', copyThemeFigmaTokens);

  // Export
  $('btnCopyAllExport').addEventListener('click', copyAllExport);
  $('btnDownloadCss').addEventListener('click', downloadCss);

  // Manual color input
  $('manualColorInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyManualColor(); });
  $('manualColorInput').addEventListener('blur', applyManualColor);

  // Share color link
  $('btnShare').addEventListener('click', shareColorLink);

  // History search
  $('historySearch').addEventListener('input', () => renderHistory());

  // Import palette
  $('btnToggleImport').addEventListener('click', toggleImportPanel);
  $('btnImportPalette').addEventListener('click', importPalette);

  // Export variable name
  $('exportVarName').addEventListener('input', e => {
    exportVarName = e.target.value.trim() || '--color-primary';
    chrome.storage.local.set({ exportVarName });
    renderExport();
  });

  // Palette collections
  $('btnNewPalette').addEventListener('click', createPaletteCollection);

  // Gradient builder
  $('btnAddGradStop').addEventListener('click', addGradientStop);
  $('gradientDirection').addEventListener('change', renderGradient);
  $('btnCopyGradient').addEventListener('click', copyGradientCss);

  // Color blindness swatch clicks
  ['cbNormal', 'cbDeuteranopia', 'cbProtanopia', 'cbTritanopia'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('click', () => {
      const r = parseInt(el.dataset.r), g = parseInt(el.dataset.g), b = parseInt(el.dataset.b);
      if (!isNaN(r)) {
        currentColor = { r, g, b };
        colorHistory.unshift({ r, g, b });
        if (colorHistory.length > 20) colorHistory.pop();
        chrome.storage.local.set({ colorHistory });
        updateColorDisplay(currentColor);
        renderHistory();
        showToast('Loaded ' + ColorConverter.toHex(r, g, b).toUpperCase(), 'success');
      }
    });
  });

  // Image eyedropper
  initImagePicker();

  // Feature 1: Random color & palette
  $('btnRandom').addEventListener('click', () => generateRandomColor());
  $('btnRandomPalette').addEventListener('click', toggleRandomPalette);

  // Feature 3: Alpha slider
  $('alphaSlider').addEventListener('input', e => {
    currentAlpha = parseInt(e.target.value) / 100;
    $('alphaValue').textContent = e.target.value + '%';
    updateColorDisplay(currentColor);
  });

  // Feature 4: Compare section
  $('compareToggle').addEventListener('click', toggleCompare);
  $('compareColorB').addEventListener('input', e => {
    const rgb = ColorConverter.hexToRgb(e.target.value);
    if (rgb) { compareColorB = rgb; updateCompare(); }
  });
  $('btnSwapCompare').addEventListener('click', swapCompare);
  $('btnSetCompareA').addEventListener('click', () => { updateCompare(); showToast('A updated', 'success'); });

  // Feature 5: Page Color Audit
  $('btnScanPage').addEventListener('click', scanPageColors);

  // Feature 9: Keyboard shortcuts
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    switch (e.key) {
      case 'p': case 'P': e.preventDefault(); startPicking(); break;
      case 'c': case 'C': {
        e.preventDefault();
        const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
        navigator.clipboard.writeText(hex.toUpperCase())
          .then(() => showToast('Copied ' + hex.toUpperCase(), 'success'));
        break;
      }
      case 'r': case 'R': e.preventDefault(); generateRandomColor(); break;
      case 'ArrowLeft': {
        e.preventDefault();
        if (!colorHistory.length) break;
        historyIndex = Math.min(historyIndex + 1, colorHistory.length - 1);
        const c = colorHistory[historyIndex];
        currentColor = { r: c.r, g: c.g, b: c.b };
        updateColorDisplay(currentColor);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (historyIndex <= 0) { historyIndex = -1; break; }
        historyIndex--;
        if (historyIndex >= 0) {
          const c = colorHistory[historyIndex];
          currentColor = { r: c.r, g: c.g, b: c.b };
          updateColorDisplay(currentColor);
        }
        break;
      }
      case 'Escape': document.activeElement?.blur(); break;
    }
  });

  // Listen for new picks while popup is open
  chrome.storage.onChanged.addListener(onStorageChange);
});

// ═══════════════════════════════════════════════════
// COLOR DISPLAY
// ═══════════════════════════════════════════════════
function updateColorDisplay({ r, g, b }) {
  const hex    = ColorConverter.toHex(r, g, b);
  const rgb    = ColorConverter.toRgb(r, g, b);
  const norm   = ColorConverter.toRgbNorm(r, g, b);
  const hsl    = ColorConverter.toHsl(r, g, b);
  const oklch  = ColorConverter.toOklch(r, g, b);

  // Alpha-aware swatch with checkerboard
  const swatchColorLayer = $('swatchColorLayer');
  const swatchChecker = $('swatchChecker');
  if (currentAlpha < 1) {
    swatchColorLayer.style.background = `rgba(${r},${g},${b},${currentAlpha.toFixed(2)})`;
    swatchChecker.style.display = 'block';
  } else {
    swatchColorLayer.style.background = hex;
    swatchChecker.style.display = 'none';
  }
  $('swatchColorInput').value = hex;

  // Auto-contrasting text color on hero banner
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const heroText = luminance > 0.55 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
  const heroInner = $('colorHeroInner');
  if (heroInner) heroInner.style.color = heroText;

  $('hexLarge').textContent  = hex.toUpperCase();
  $('rgbSmall').textContent  = rgb;
  $('valHex').textContent    = hex.toUpperCase();
  $('valRgb').textContent    = rgb;
  $('valNorm').textContent   = norm;
  $('valHsl').textContent    = hsl;
  $('valOklch').textContent  = oklch;

  // Feature 3: Alpha format rows
  const { h: hslH, s: hslS, l: hslL } = ColorConverter._rgbToHslVals(r, g, b);
  const alphaStr = currentAlpha.toFixed(2);
  const alphaHex = Math.round(currentAlpha * 255).toString(16).padStart(2, '0').toUpperCase();
  $('valRgba').textContent = `rgba(${r}, ${g}, ${b}, ${alphaStr})`;
  $('valHsla').textContent = `hsla(${Math.round(hslH)}, ${Math.round(hslS)}%, ${Math.round(hslL)}%, ${alphaStr})`;
  $('valHex8').textContent = `${hex.toUpperCase()}${alphaHex}`;
  const showAlpha = currentAlpha < 1;
  $('rowRgba').style.display = showAlpha ? '' : 'none';
  $('rowHsla').style.display = showAlpha ? '' : 'none';
  $('rowHex8').style.display = showAlpha ? '' : 'none';

  // Feature 2: CSS color name
  const colorNameEl = $('colorNameDisplay');
  if (colorNameEl) colorNameEl.textContent = '≈ ' + ColorNames.findNearest(r, g, b);

  // Feature 6: Color temperature
  const tempEl = $('colorTempPill');
  if (tempEl) {
    const temp = getColorTemperature(hslH);
    tempEl.textContent = temp.label;
    tempEl.className = 'color-temp-pill ' + temp.cls;
  }

  // Feature 7: Tailwind class
  const tailwindEl = $('colorTailwindDisplay');
  if (tailwindEl) tailwindEl.textContent = '≈ ' + TailwindColors.findNearest(r, g, b);

  // Feature 14: Pantone & RAL
  const pantoneEl = $('colorPantoneDisplay');
  if (pantoneEl) pantoneEl.textContent = '≈ Pantone ' + findNearestPantone(r, g, b) + ' · RAL ' + findNearestRAL(r, g, b);

  // Auto-fill WCAG foreground
  $('fgColor').value = hex;
  $('fgHex').value   = hex;
  updateContrast();

  // Auto-fill theme base
  $('themeBase').value    = hex;
  $('themeBaseHex').value = hex;

  renderExport();
  updateColorBlindness();

  // Feature 4: Update compare if panel is open
  const comparePanel = $('comparePanel');
  if (comparePanel && comparePanel.style.display !== 'none') updateCompare();
}

// ═══════════════════════════════════════════════════
// PICK COLOR
// ═══════════════════════════════════════════════════
async function startPicking() {
  const btn = $('btnPick');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Starting…`;

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id) {
      showToast('No active tab found', 'error');
      return;
    }
    if (/^(chrome|about|chrome-extension|edge|brave):/.test(tab.url || '')) {
      showToast('Cannot pick colors from browser pages', 'error');
      return;
    }

    // Wait for background to confirm it successfully injected + started the overlay
    const response = await chrome.runtime.sendMessage({
      action: 'startPick', tabId: tab.id, windowId: tab.windowId
    });

    if (response?.success) {
      window.close(); // only close after overlay is confirmed active
    } else {
      showToast('Could not start picker: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (e) {
    // sendMessage throws if background SW is waking up — retry once
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id) {
        const resp = await chrome.runtime.sendMessage({
          action: 'startPick', tabId: tab.id, windowId: tab.windowId
        });
        if (resp?.success) { window.close(); return; }
      }
    } catch (_) {}
    showToast('Error: ' + e.message, 'error');
  } finally {
    // Restore button if we're still open (error path)
    if (document.body) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
}

// ═══════════════════════════════════════════════════
// COLOR HISTORY
// ═══════════════════════════════════════════════════
function renderHistory() {
  const grid = $('historyPalette');
  const query = ($('historySearch') ? $('historySearch').value : '').toLowerCase().trim();

  // Render pinned section
  renderPinnedSection();

  grid.innerHTML = '';

  if (!colorHistory.length) {
    grid.innerHTML = '<div class="history-empty">No colors picked yet</div>';
    return;
  }

  let visibleCount = 0;
  colorHistory.forEach(({ r, g, b, timestamp }) => {
    const hex = ColorConverter.toHex(r, g, b);
    if (query && !hex.toLowerCase().includes(query)) return;
    visibleCount++;

    const swatch = document.createElement('div');
    swatch.className = 'history-swatch';
    swatch.style.background = hex;
    const timeStr = timestamp ? relativeTime(timestamp) : '';
    swatch.title = hex.toUpperCase() + (timeStr ? ' • ' + timeStr : '');
    swatch.dataset.hex = hex.toLowerCase();
    if (timeStr) swatch.dataset.time = timeStr;

    const isPinned = pinnedColors.some(p => ColorConverter.toHex(p.r, p.g, p.b) === hex);
    const star = document.createElement('div');
    star.className = 'pin-star' + (isPinned ? ' pinned' : '');
    star.textContent = isPinned ? '★' : '☆';
    star.title = isPinned ? 'Unpin' : 'Pin';
    star.addEventListener('click', e => { e.stopPropagation(); togglePin(r, g, b); });

    swatch.addEventListener('click', () => {
      currentColor = { r, g, b };
      updateColorDisplay(currentColor);
      switchTab('picker');
      showToast('Loaded ' + hex.toUpperCase(), 'success');
    });

    swatch.appendChild(star);
    grid.appendChild(swatch);
  });

  if (visibleCount === 0 && query) {
    grid.innerHTML = '<div class="history-empty">No results</div>';
  }
}

function renderPinnedSection() {
  const section = $('pinnedSection');
  const grid = $('pinnedPalette');
  if (!section || !grid) return;

  if (!pinnedColors.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  grid.innerHTML = '';

  pinnedColors.forEach(({ r, g, b }) => {
    const hex = ColorConverter.toHex(r, g, b);
    const swatch = document.createElement('div');
    swatch.className = 'history-swatch';
    swatch.style.background = hex;
    swatch.title = hex.toUpperCase();

    const star = document.createElement('div');
    star.className = 'pin-star pinned';
    star.textContent = '★';
    star.title = 'Unpin';
    star.addEventListener('click', e => { e.stopPropagation(); togglePin(r, g, b); });

    swatch.addEventListener('click', () => {
      currentColor = { r, g, b };
      updateColorDisplay(currentColor);
      switchTab('picker');
      showToast('Loaded ' + hex.toUpperCase(), 'success');
    });

    swatch.appendChild(star);
    grid.appendChild(swatch);
  });
}

function togglePin(r, g, b) {
  const hex = ColorConverter.toHex(r, g, b);
  const idx = pinnedColors.findIndex(p => ColorConverter.toHex(p.r, p.g, p.b) === hex);
  if (idx >= 0) {
    pinnedColors.splice(idx, 1);
    showToast('Unpinned ' + hex.toUpperCase());
  } else {
    pinnedColors.push({ r, g, b });
    showToast('Pinned ' + hex.toUpperCase(), 'success');
  }
  chrome.storage.local.set({ pinnedColors });
  renderHistory();
}

async function clearHistory() {
  colorHistory = [];
  await chrome.storage.local.remove('colorHistory');
  renderHistory();
  showToast('History cleared');
}

// ═══════════════════════════════════════════════════
// WCAG CONTRAST
// ═══════════════════════════════════════════════════
function initWcag() {
  const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
  $('fgColor').value = hex;
  $('fgHex').value   = hex;
  updateContrast();
}

function syncColorField(which, hex) {
  $(`${which}Hex`).value = hex;
  updateContrast();
}

function syncHexField(which, rawVal) {
  const clean = rawVal.startsWith('#') ? rawVal : '#' + rawVal;
  const rgb = ColorConverter.hexToRgb(clean);
  if (rgb) {
    $(`${which}Color`).value = clean;
    updateContrast();
  }
}

function swapContrastColors() {
  const fgHex = $('fgHex').value;
  const bgHex = $('bgHex').value;
  $('fgHex').value   = bgHex;
  $('fgColor').value = bgHex;
  $('bgHex').value   = fgHex;
  $('bgColor').value = fgHex;
  updateContrast();
}

function updateContrast() {
  const fgRgb = ColorConverter.hexToRgb($('fgColor').value);
  const bgRgb = ColorConverter.hexToRgb($('bgColor').value);
  if (!fgRgb || !bgRgb) return;

  const ratio = WCAGChecker.ratio(fgRgb, bgRgb);
  const ev    = WCAGChecker.evaluate(ratio);

  $('contrastRatio').textContent = ratio.toFixed(2) + ':1';

  // Preview
  const preview = $('contrastPreview');
  preview.style.background  = $('bgColor').value;
  $('previewText').style.color = $('fgColor').value;

  // Badges
  setBadge('badgeAA',    ev.aa,    'AA');
  setBadge('badgeAAA',   ev.aaa,   'AAA');
  setBadge('badgeAALg',  ev.aaLg,  'AA Lg');
  setBadge('badgeAAALg', ev.aaaLg, 'AAA Lg');
}

function setBadge(id, pass, label) {
  const el = $(id);
  el.textContent = label;
  el.classList.toggle('pass', pass);
}

// ═══════════════════════════════════════════════════
// THEME GENERATOR
// ═══════════════════════════════════════════════════
function initTheme() {
  const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
  $('themeBase').value    = hex;
  $('themeBaseHex').value = hex;
  generateTheme();
}

function syncThemeField(_, hex) {
  $('themeBaseHex').value = hex;
  generateTheme();
}

function syncThemeHexField(rawVal) {
  const clean = rawVal.startsWith('#') ? rawVal : '#' + rawVal;
  const rgb = ColorConverter.hexToRgb(clean);
  if (rgb) {
    $('themeBase').value = clean;
    generateTheme();
  }
}

function generateTheme() {
  const rgb = ColorConverter.hexToRgb($('themeBase').value);
  if (!rgb) return;

  // Reset adjustments on new generation
  themeHueShift = 0; themeSatAdj = 0; themeLightAdj = 0;
  lockedSwatches = new Set();
  if ($('themeHueSlider'))   { $('themeHueSlider').value = 0;   $('themeHueVal').textContent = '0°'; }
  if ($('themeSatSlider'))   { $('themeSatSlider').value = 0;   $('themeSatVal').textContent = '0'; }
  if ($('themeLightSlider')) { $('themeLightSlider').value = 0; $('themeLightVal').textContent = '0'; }

  if (themeMode === 'mono') {
    themePaletteBase = generateMonoPalette(rgb.r, rgb.g, rgb.b);
  } else if (themeMode === 'duotone') {
    themePaletteBase = generateDuotonePalette(rgb.r, rgb.g, rgb.b);
  } else if (themeMode === 'material') {
    themePaletteBase = generateMaterialPalette(rgb.r, rgb.g, rgb.b);
  } else {
    themePaletteBase = ThemeGenerator.generate(rgb.r, rgb.g, rgb.b);
  }

  renderThemePalette(themePaletteBase);
  $('themeActions').style.display = 'flex';
  $('themeAdjPanel').style.display = '';
  $('themePreview').style.display = '';
}

function generateMonoPalette(r, g, b) {
  const { h, s } = ColorConverter._rgbToHslVals(r, g, b);
  const steps = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  return { type: 'mono', scale: steps.map(l => ColorConverter.hslToRgb(h, s, l)) };
}

function generateDuotonePalette(r, g, b) {
  const rgb2Hex = $('themeBase2') ? $('themeBase2').value : null;
  let rgb2 = rgb2Hex ? ColorConverter.hexToRgb(rgb2Hex) : null;
  if (!rgb2) {
    // Default: complement of base
    const { h, s, l } = ColorConverter._rgbToHslVals(r, g, b);
    rgb2 = ColorConverter.hslToRgb((h + 180) % 360, s, l);
  }
  const ts = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const blend = ts.map(t => ({
    r: Math.round(r + (rgb2.r - r) * t),
    g: Math.round(g + (rgb2.g - g) * t),
    b: Math.round(b + (rgb2.b - b) * t)
  }));
  return { type: 'duotone', blend };
}

function generateMaterialPalette(r, g, b) {
  const base = { r, g, b };
  const mix = (from, to, t) => ({
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t)
  });
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const scale = [
    { step: 50,  ...mix(base, white, 0.92) },
    { step: 100, ...mix(base, white, 0.88) },
    { step: 200, ...mix(base, white, 0.76) },
    { step: 300, ...mix(base, white, 0.62) },
    { step: 400, ...mix(base, white, 0.44) },
    { step: 500, ...base },
    { step: 600, ...mix(base, black, 0.15) },
    { step: 700, ...mix(base, black, 0.28) },
    { step: 800, ...mix(base, black, 0.42) },
    { step: 900, ...mix(base, black, 0.57) }
  ];
  return { type: 'material', scale };
}

function buildAdjustedPalette(base) {
  const adjColor = (c) => {
    const baseHex = ColorConverter.toHex(c.r, c.g, c.b);
    if (lockedSwatches.has(baseHex)) return c;
    if (!themeHueShift && !themeSatAdj && !themeLightAdj) return c;
    const { h, s, l } = ColorConverter._rgbToHslVals(c.r, c.g, c.b);
    const nh = ((h + themeHueShift) % 360 + 360) % 360;
    const ns = Math.max(0, Math.min(100, s + themeSatAdj));
    const nl = Math.max(5, Math.min(95, l + themeLightAdj));
    return ColorConverter.hslToRgb(nh, ns, nl);
  };
  if (base.type === 'mono') {
    return { ...base, scale: base.scale.map(adjColor) };
  }
  if (base.type === 'duotone') {
    return { ...base, blend: base.blend.map(adjColor) };
  }
  if (base.type === 'material') {
    return { ...base, scale: base.scale.map(c => ({ step: c.step, ...adjColor(c) })) };
  }
  // harmony
  return {
    ...base,
    base:          adjColor(base.base),
    tints:         base.tints.map(adjColor),
    shades:        base.shades.map(adjColor),
    complementary: base.complementary.map(adjColor),
    triadic:       base.triadic.map(adjColor),
    analogous:     base.analogous.map(adjColor),
    splitComp:     base.splitComp.map(adjColor)
  };
}

function renderThemePalette(basePalette) {
  const container = $('themePalette');
  container.innerHTML = '';

  const adjusted = buildAdjustedPalette(basePalette);
  themePalette = adjusted; // keep in sync for export functions

  function makeSwatchEl(baseColor, adjColor, stepLabel) {
    const baseHex = ColorConverter.toHex(baseColor.r, baseColor.g, baseColor.b);
    const isLocked = lockedSwatches.has(baseHex);
    const displayColor = isLocked ? baseColor : adjColor;
    const displayHex = ColorConverter.toHex(displayColor.r, displayColor.g, displayColor.b);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';

    const sw = document.createElement('div');
    sw.className = 'palette-swatch' + (isLocked ? ' swatch-locked' : '');
    sw.style.background = displayHex;
    sw.title = displayHex.toUpperCase() + (stepLabel ? ' · ' + stepLabel : '');
    sw.addEventListener('click', () => {
      currentColor = { ...displayColor };
      updateColorDisplay(displayColor);
      switchTab('picker');
      showToast('Loaded ' + displayHex.toUpperCase(), 'success');
    });

    const lockBtn = document.createElement('span');
    lockBtn.className = 'theme-swatch-lock' + (isLocked ? ' always-show' : '');
    lockBtn.textContent = '🔒';
    lockBtn.title = isLocked ? 'Click to unlock' : 'Click to lock';
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (lockedSwatches.has(baseHex)) lockedSwatches.delete(baseHex);
      else lockedSwatches.add(baseHex);
      renderThemePalette(basePalette);
    });
    sw.appendChild(lockBtn);
    wrap.appendChild(sw);

    if (stepLabel) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font:400 8px/1 var(--font-mono);color:var(--text-muted);text-align:center;';
      lbl.textContent = stepLabel;
      wrap.appendChild(lbl);
    }
    return wrap;
  }

  function makeRow(label, baseColors, adjColors, stepLabels) {
    const row = document.createElement('div');
    row.className = 'palette-row';
    const lbl = document.createElement('div');
    lbl.className = 'palette-row-label';
    lbl.textContent = label;
    const swatches = document.createElement('div');
    swatches.className = 'palette-swatches';
    baseColors.forEach((bc, i) => swatches.appendChild(makeSwatchEl(bc, adjColors[i], stepLabels ? stepLabels[i] : null)));
    row.appendChild(lbl);
    row.appendChild(swatches);
    container.appendChild(row);
  }

  if (basePalette.type === 'mono') {
    makeRow('Monochromatic Scale', basePalette.scale, adjusted.scale);
  } else if (basePalette.type === 'duotone') {
    makeRow('Duotone Blend', basePalette.blend, adjusted.blend);
  } else if (basePalette.type === 'material') {
    const steps = basePalette.scale.map(c => String(c.step));
    makeRow('Material Scale', basePalette.scale, adjusted.scale, steps);
  } else {
    const rows = [
      { label: 'Tints',         base: basePalette.tints,         adj: adjusted.tints },
      { label: 'Base',          base: [basePalette.base],         adj: [adjusted.base] },
      { label: 'Shades',        base: basePalette.shades,         adj: adjusted.shades },
      { label: 'Complementary', base: basePalette.complementary,  adj: adjusted.complementary },
      { label: 'Triadic',       base: basePalette.triadic,        adj: adjusted.triadic },
      { label: 'Analogous',     base: basePalette.analogous,      adj: adjusted.analogous },
      { label: 'Split Comp.',   base: basePalette.splitComp,      adj: adjusted.splitComp }
    ];
    rows.forEach(({ label, base, adj }) => makeRow(label, base, adj));
  }

  renderThemePreview(basePalette);
}

function copyThemeCss() {
  if (!themePalette) return;
  const text = ThemeGenerator.toCssVars(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('CSS variables copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function copyThemeTailwind() {
  if (!themePalette) return;
  const text = ThemeGenerator.toTailwindConfig(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('Tailwind config copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function copyThemeScss() {
  if (!themePalette) return;
  const text = ThemeGenerator.toScss(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('SCSS copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function copyThemeJsonTokens() {
  if (!themePalette) return;
  const text = ThemeGenerator.toJsonTokens(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('JSON tokens copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function copyThemeFigmaTokens() {
  if (!themePalette) return;
  const text = ThemeGenerator.toFigmaTokens(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('Figma tokens copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function renderThemePresets() {
  const list = $('themePresetList');
  if (!list) return;
  list.innerHTML = '';
  if (!themePresets.length) {
    list.innerHTML = '<div class="history-empty" style="font-size:11px;padding:4px 0;">No presets saved</div>';
    return;
  }
  themePresets.forEach((preset, idx) => {
    const item = document.createElement('div');
    item.className = 'theme-preset-item';

    const circle = document.createElement('div');
    circle.style.cssText = `width:14px;height:14px;border-radius:50%;background:${preset.hex};border:1px solid var(--border);flex-shrink:0;`;

    const nameLbl = document.createElement('span');
    nameLbl.className = 'theme-preset-name';
    nameLbl.textContent = preset.name + (preset.mode && preset.mode !== 'harmony' ? ` (${preset.mode})` : '');

    const del = document.createElement('button');
    del.className = 'btn-copy';
    del.title = 'Delete preset';
    del.innerHTML = '&times;';
    del.addEventListener('click', e => { e.stopPropagation(); deleteThemePreset(idx); });

    item.appendChild(circle);
    item.appendChild(nameLbl);
    item.appendChild(del);
    item.addEventListener('click', () => {
      $('themeBase').value    = preset.hex;
      $('themeBaseHex').value = preset.hex;
      themeMode = preset.mode || 'harmony';
      document.querySelectorAll('.theme-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === themeMode);
      });
      const duoRow = $('duotoneColorRow');
      if (duoRow) duoRow.style.display = themeMode === 'duotone' ? '' : 'none';
      generateTheme();
      showToast('Loaded: ' + preset.name, 'success');
    });
    list.appendChild(item);
  });
}

function saveThemePreset() {
  const input = $('themePresetName');
  const name = input ? input.value.trim() : '';
  if (!name) { showToast('Enter a preset name', 'error'); return; }
  const hex = $('themeBase').value;
  themePresets.push({ name, hex, mode: themeMode });
  chrome.storage.local.set({ themePresets });
  input.value = '';
  renderThemePresets();
  showToast('Preset saved!', 'success');
}

function deleteThemePreset(idx) {
  themePresets.splice(idx, 1);
  chrome.storage.local.set({ themePresets });
  renderThemePresets();
  showToast('Preset deleted');
}

function renderThemePreview(basePalette) {
  const wrap = $('themePreviewCards');
  if (!wrap) return;
  const adjusted = buildAdjustedPalette(basePalette);

  let base, lightest, darkest, comp, mid;
  if (adjusted.type === 'mono') {
    base     = adjusted.scale[4];
    lightest = adjusted.scale[9];
    darkest  = adjusted.scale[0];
    mid      = adjusted.scale[6];
    comp     = adjusted.scale[7];
  } else if (adjusted.type === 'duotone') {
    base     = adjusted.blend[4];
    lightest = adjusted.blend[8];
    darkest  = adjusted.blend[0];
    mid      = adjusted.blend[5];
    comp     = adjusted.blend[6];
  } else if (adjusted.type === 'material') {
    base     = adjusted.scale[5]; // 500
    lightest = adjusted.scale[0]; // 50
    darkest  = adjusted.scale[9]; // 900
    mid      = adjusted.scale[3]; // 300
    comp     = adjusted.scale[7]; // 700
  } else {
    base     = adjusted.base;
    lightest = adjusted.tints[4];
    darkest  = adjusted.shades[4];
    mid      = adjusted.tints[2];
    comp     = (adjusted.complementary && adjusted.complementary[0]) || adjusted.base;
  }

  const toHex = c => ColorConverter.toHex(c.r, c.g, c.b);
  const lum = c => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  const contrast = c => lum(c) > 0.5 ? '#111' : '#fff';

  const baseHex = toHex(base);
  const baseContrast = contrast(base);
  const compHex = toHex(comp);
  const compContrast = contrast(comp);

  function makeCard(isDark) {
    const cardBg    = isDark ? toHex(darkest) : toHex(lightest);
    const bodyText  = isDark ? toHex(lightest) : toHex(darkest);
    const borderClr = toHex(mid);
    return `<div class="theme-preview-card" style="background:${cardBg};border:1.5px solid ${borderClr};">` +
      `<div style="background:${baseHex};color:${baseContrast};padding:5px 8px;font-size:9px;font-weight:600;border-radius:5px 5px 0 0;">${isDark ? 'Dark Mode' : 'Light Mode'}</div>` +
      `<div style="padding:6px 8px;flex:1;">` +
        `<div style="color:${bodyText};font-size:8px;margin-bottom:5px;">Sample text content</div>` +
        `<div style="display:flex;gap:4px;align-items:center;">` +
          `<button style="background:${baseHex};color:${baseContrast};border:none;border-radius:3px;padding:2px 6px;font-size:8px;cursor:default;">Button</button>` +
          `<span style="background:${compHex};color:${compContrast};border-radius:8px;padding:1px 5px;font-size:7px;">Badge</span>` +
        `</div>` +
      `</div>` +
    `</div>`;
  }

  wrap.innerHTML = makeCard(false) + makeCard(true);
}

// ═══════════════════════════════════════════════════
// EXPORT PANEL
// ═══════════════════════════════════════════════════
function renderExport() {
  const { r, g, b } = currentColor;
  const varName = exportVarName || '--color-primary';
  const rawBlocks = ExportManager.blocks(r, g, b);
  const blocks = rawBlocks.map(({ title, content }) => ({
    title,
    content: content.replace(/--color-primary/g, varName)
  }));
  const container = $('exportBlocks');
  container.innerHTML = '';

  blocks.forEach(({ title, content }) => {
    const block = document.createElement('div');
    block.className = 'export-block';

    const header = document.createElement('div');
    header.className = 'export-block-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'export-block-title';
    titleEl.textContent = title;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(content)
        .then(() => { copyBtn.classList.add('copied'); setTimeout(() => copyBtn.classList.remove('copied'), 1500); showToast('Copied!', 'success'); })
        .catch(() => showToast('Copy failed', 'error'));
    });

    const body = document.createElement('div');
    body.className = 'export-block-body';
    body.textContent = content;

    header.appendChild(titleEl);
    header.appendChild(copyBtn);
    block.appendChild(header);
    block.appendChild(body);
    container.appendChild(block);
  });
}

function copyAllExport() {
  const { r, g, b } = currentColor;
  const varName = exportVarName || '--color-primary';
  const text = ExportManager.allText(r, g, b).replace(/--color-primary/g, varName);
  navigator.clipboard.writeText(text)
    .then(() => showToast('All formats copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function downloadCss() {
  const { r, g, b } = currentColor;
  const varName = exportVarName || '--color-primary';
  const text = ExportManager.allText(r, g, b).replace(/--color-primary/g, varName);
  const hex  = ColorConverter.toHex(r, g, b).slice(1);
  const blob = new Blob([text], { type: 'text/css' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `color-${hex}.css`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloading…', 'success');
}

// ═══════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
}

// ═══════════════════════════════════════════════════
// CLIPBOARD COPY
// ═══════════════════════════════════════════════════
function copyText(text, btn) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1500); }
      showToast('Copied!', 'success');
    })
    .catch(() => showToast('Copy failed', 'error'));
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ═══════════════════════════════════════════════════
// STORAGE CHANGE LISTENER (live update if popup stays open)
// ═══════════════════════════════════════════════════
function onStorageChange(changes) {
  if (changes.pendingColor?.newValue) {
    currentColor = changes.pendingColor.newValue;
    chrome.storage.local.remove('pendingColor');
    chrome.action.setBadgeText({ text: '' }).catch(() => {});
    updateColorDisplay(currentColor);
    showToast('Color picked!', 'success');
  }
  if (changes.colorHistory?.newValue) {
    colorHistory = changes.colorHistory.newValue;
    renderHistory();
  }
  // Feature 12: Multi-tab sync
  if (changes.pinnedColors?.newValue) {
    pinnedColors = changes.pinnedColors.newValue;
    renderHistory();
  }
  if (changes.palettes?.newValue) {
    palettes = changes.palettes.newValue;
    renderPaletteCollections();
  }
  if (changes.exportVarName?.newValue) {
    exportVarName = changes.exportVarName.newValue;
    const el = $('exportVarName');
    if (el) el.value = exportVarName;
    renderExport();
  }
}

// ═══════════════════════════════════════════════════
// FEATURE 1: MANUAL COLOR INPUT
// ═══════════════════════════════════════════════════
function applyManualColor() {
  const input = $('manualColorInput');
  const raw = input.value.trim();
  if (!raw) { input.style.borderColor = ''; return; }

  const parsed = parseManualColorInput(raw);
  if (parsed) {
    input.style.borderColor = '';
    currentColor = parsed;
    colorHistory.unshift(parsed);
    if (colorHistory.length > 20) colorHistory.pop();
    chrome.storage.local.set({ colorHistory });
    updateColorDisplay(currentColor);
    renderHistory();
  } else {
    input.style.borderColor = 'var(--danger)';
  }
}

function parseManualColorInput(str) {
  str = str.trim();
  const hexMatch = str.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    return ColorConverter.hexToRgb(str.startsWith('#') ? str : '#' + str);
  }
  const rgbMatch = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]), g = parseInt(rgbMatch[2]), b = parseInt(rgbMatch[3]);
    if (r <= 255 && g <= 255 && b <= 255) return { r, g, b };
  }
  return null;
}

// ═══════════════════════════════════════════════════
// FEATURE 2: SHARE COLOR LINK
// ═══════════════════════════════════════════════════
function shareColorLink() {
  const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b).slice(1);
  const url = `https://coolors.co/${hex}`;
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

// ═══════════════════════════════════════════════════
// FEATURE 5: IMPORT PALETTE
// ═══════════════════════════════════════════════════
function toggleImportPanel() {
  const panel = $('importPanel');
  const btn = $('btnToggleImport');
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? '' : 'none';
  btn.textContent = isHidden ? '▾ Hide' : '▸ Show';
}

function importPalette() {
  const textarea = $('importPaletteInput');
  const raw = textarea.value;
  const tokens = raw.split(/[\s,\n]+/).filter(Boolean);
  let added = 0;

  tokens.forEach(tok => {
    tok = tok.trim();
    const rgb = ColorConverter.hexToRgb(tok.startsWith('#') ? tok : '#' + tok);
    if (rgb) { colorHistory.unshift(rgb); added++; }
  });

  if (added > 0) {
    if (colorHistory.length > 20) colorHistory.length = 20;
    chrome.storage.local.set({ colorHistory });
    renderHistory();
    textarea.value = '';
    showToast(`Imported ${added} color${added > 1 ? 's' : ''}`, 'success');
  } else {
    showToast('No valid hex codes found', 'error');
  }
}

// ═══════════════════════════════════════════════════
// FEATURE 6: PALETTE COLLECTIONS
// ═══════════════════════════════════════════════════
function renderPaletteCollections() {
  const list = $('paletteCollectionList');
  if (!list) return;
  list.innerHTML = '';

  if (!palettes.length) {
    list.innerHTML = '<div class="history-empty">No collections yet</div>';
    return;
  }

  palettes.forEach((palette, idx) => {
    const item = document.createElement('div');
    item.className = 'palette-collection-item';

    const header = document.createElement('div');
    header.className = 'palette-collection-header';

    const name = document.createElement('span');
    name.className = 'palette-collection-name';
    name.textContent = palette.name;

    const actions = document.createElement('div');
    actions.className = 'palette-collection-actions';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-copy';
    addBtn.title = 'Add current color';
    addBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    addBtn.addEventListener('click', () => addColorToPaletteCollection(idx));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-copy';
    delBtn.title = 'Delete collection';
    delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.addEventListener('click', () => deletePaletteCollection(idx));

    actions.appendChild(addBtn);
    actions.appendChild(delBtn);
    header.appendChild(name);
    header.appendChild(actions);

    const swatches = document.createElement('div');
    swatches.className = 'palette-collection-swatches';

    if (!palette.colors.length) {
      swatches.innerHTML = '<span class="palette-empty-text">No colors yet — click + to add</span>';
    } else {
      palette.colors.forEach(c => {
        const hex = ColorConverter.toHex(c.r, c.g, c.b);
        const sw = document.createElement('div');
        sw.className = 'palette-collection-swatch';
        sw.style.background = hex;
        sw.title = hex.toUpperCase();
        sw.addEventListener('click', () => {
          currentColor = { ...c };
          updateColorDisplay(currentColor);
          switchTab('picker');
          showToast('Loaded ' + hex.toUpperCase(), 'success');
        });
        swatches.appendChild(sw);
      });
    }

    item.appendChild(header);
    item.appendChild(swatches);
    list.appendChild(item);
  });
}

function createPaletteCollection() {
  const input = $('paletteNameInput');
  const name = input.value.trim();
  if (!name) { showToast('Enter a collection name', 'error'); return; }
  palettes.push({ name, colors: [] });
  chrome.storage.local.set({ palettes });
  input.value = '';
  renderPaletteCollections();
  showToast('Collection created!', 'success');
}

function addColorToPaletteCollection(idx) {
  palettes[idx].colors.push({ ...currentColor });
  chrome.storage.local.set({ palettes });
  renderPaletteCollections();
  showToast('Added ' + ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b).toUpperCase(), 'success');
}

function deletePaletteCollection(idx) {
  palettes.splice(idx, 1);
  chrome.storage.local.set({ palettes });
  renderPaletteCollections();
  showToast('Collection deleted');
}

// ═══════════════════════════════════════════════════
// FEATURE 7: GRADIENT BUILDER
// ═══════════════════════════════════════════════════
function initGradientBuilder() {
  const { r, g, b } = currentColor;
  const { h, s, l } = ColorConverter._rgbToHslVals(r, g, b);
  const comp = ColorConverter.hslToRgb((h + 180) % 360, s, l);
  gradStops = [{ r, g, b }, { r: comp.r, g: comp.g, b: comp.b }];
  renderGradientStops();
  renderGradient();
}

function renderGradientStops() {
  const container = $('gradientStops');
  if (!container) return;
  container.innerHTML = '';

  gradStops.forEach((stop, idx) => {
    const hex = ColorConverter.toHex(stop.r, stop.g, stop.b);
    const row = document.createElement('div');
    row.className = 'gradient-stop-row';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'gradient-stop-color';
    colorInput.value = hex;

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'gradient-stop-hex';
    hexInput.value = hex.toUpperCase();
    hexInput.maxLength = 7;

    colorInput.addEventListener('input', e => {
      const rgb = ColorConverter.hexToRgb(e.target.value);
      if (rgb) { gradStops[idx] = rgb; hexInput.value = ColorConverter.toHex(rgb.r, rgb.g, rgb.b).toUpperCase(); renderGradient(); }
    });

    hexInput.addEventListener('input', e => {
      const rgb = ColorConverter.hexToRgb(e.target.value);
      if (rgb) { gradStops[idx] = rgb; colorInput.value = ColorConverter.toHex(rgb.r, rgb.g, rgb.b); renderGradient(); }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-copy';
    delBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.title = 'Remove stop';
    delBtn.disabled = gradStops.length <= 2;
    delBtn.style.opacity = gradStops.length <= 2 ? '0.3' : '1';
    delBtn.addEventListener('click', () => {
      if (gradStops.length > 2) { gradStops.splice(idx, 1); renderGradientStops(); renderGradient(); }
    });

    row.appendChild(colorInput);
    row.appendChild(hexInput);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

function addGradientStop() {
  const last = gradStops[gradStops.length - 1];
  gradStops.push({ ...last });
  renderGradientStops();
  renderGradient();
}

function renderGradient() {
  const previewBar = $('gradientPreviewBar');
  const cssOutput = $('gradientCssOutput');
  if (!previewBar || !cssOutput || !gradStops.length) return;

  const dirEl = $('gradientDirection');
  const direction = dirEl ? dirEl.value : 'to bottom';
  const stopColors = gradStops.map(s => ColorConverter.toHex(s.r, s.g, s.b)).join(', ');

  let css;
  if (direction === 'radial') {
    css = `background: radial-gradient(circle, ${stopColors});`;
    previewBar.style.background = `radial-gradient(circle, ${stopColors})`;
  } else {
    css = `background: linear-gradient(${direction}, ${stopColors});`;
    previewBar.style.background = `linear-gradient(${direction}, ${stopColors})`;
  }
  cssOutput.value = css;
}

function copyGradientCss() {
  const output = $('gradientCssOutput');
  if (!output || !output.value) return;
  const btn = $('btnCopyGradient');
  navigator.clipboard.writeText(output.value)
    .then(() => { showToast('CSS copied!', 'success'); if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1500); } })
    .catch(() => showToast('Copy failed', 'error'));
}

// ═══════════════════════════════════════════════════
// FEATURE 8: COLOR BLINDNESS SIMULATOR
// ═══════════════════════════════════════════════════
function simulateColorBlindness(r, g, b, type) {
  let nr, ng, nb;
  if (type === 'deuteranopia') {
    nr = 0.625 * r + 0.375 * g;
    ng = 0.70  * r + 0.30  * g;
    nb = 0.30  * g + 0.70  * b;
  } else if (type === 'protanopia') {
    nr = 0.567 * r + 0.433 * g;
    ng = 0.558 * r + 0.442 * g;
    nb = 0.242 * g + 0.758 * b;
  } else if (type === 'tritanopia') {
    nr = 0.95  * r + 0.05  * g;
    ng = 0.433 * g + 0.567 * b;
    nb = 0.475 * g + 0.525 * b;
  } else {
    nr = r; ng = g; nb = b;
  }
  return {
    r: Math.round(Math.max(0, Math.min(255, nr))),
    g: Math.round(Math.max(0, Math.min(255, ng))),
    b: Math.round(Math.max(0, Math.min(255, nb)))
  };
}

function updateColorBlindness() {
  const { r, g, b } = currentColor;
  [
    { id: 'cbNormal',       type: 'normal'       },
    { id: 'cbDeuteranopia', type: 'deuteranopia' },
    { id: 'cbProtanopia',   type: 'protanopia'   },
    { id: 'cbTritanopia',   type: 'tritanopia'   }
  ].forEach(({ id, type }) => {
    const el = $(id);
    if (!el) return;
    const sim = simulateColorBlindness(r, g, b, type);
    const hex = ColorConverter.toHex(sim.r, sim.g, sim.b);
    el.style.background = hex;
    el.dataset.r = sim.r;
    el.dataset.g = sim.g;
    el.dataset.b = sim.b;
    el.title = hex.toUpperCase();
  });
}

// ═══════════════════════════════════════════════════
// FEATURE 9: IMAGE EYEDROPPER
// ═══════════════════════════════════════════════════
function initImagePicker() {
  const dropZone  = $('imageDropZone');
  const fileInput = $('imageFileInput');
  const canvas    = $('imagePickerCanvas');
  const clearBtn  = $('btnClearImage');
  if (!dropZone) return;

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });

  document.addEventListener('paste', e => {
    const panel = $('panel-tools');
    if (!panel || !panel.classList.contains('active')) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) { const f = item.getAsFile(); if (f) { loadImageFile(f); break; } }
    }
  });

  canvas.addEventListener('click', e => {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * sx);
    const y = Math.floor((e.clientY - rect.top)  * sy);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    currentColor = { r, g, b };
    colorHistory.unshift({ r, g, b });
    if (colorHistory.length > 20) colorHistory.pop();
    chrome.storage.local.set({ colorHistory });
    updateColorDisplay(currentColor);
    renderHistory();
    const hex = ColorConverter.toHex(r, g, b);
    const pickedEl = $('imagePickedHex');
    pickedEl.textContent = hex.toUpperCase();
    pickedEl.style.background = hex;
    pickedEl.style.color = (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? '#000' : '#fff';
    pickedEl.style.display = '';
    showToast('Picked ' + hex.toUpperCase(), 'success');
  });

  clearBtn.addEventListener('click', () => {
    canvas.style.display = 'none';
    $('imagePickedHex').style.display = 'none';
    clearBtn.style.display = 'none';
    dropZone.style.display = '';
    fileInput.value = '';
  });
}

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = $('imagePickerCanvas');
      const dropZone = $('imageDropZone');
      const maxW = 280;
      const ratio = Math.min(maxW / img.width, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      dropZone.style.display = 'none';
      $('btnClearImage').style.display = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════
// FEATURE 1: RANDOM COLOR GENERATOR
// ═══════════════════════════════════════════════════
function generateRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  currentColor = { r, g, b };
  historyIndex = -1;
  colorHistory.unshift({ r, g, b, timestamp: Date.now() });
  if (colorHistory.length > 20) colorHistory.pop();
  chrome.storage.local.set({ colorHistory });
  updateColorDisplay(currentColor);
  renderHistory();
  showToast('Random color!', 'success');
}

function toggleRandomPalette() {
  const container = $('randomPaletteSwatches');
  if (!container) return;
  const hidden = container.style.display === 'none';
  container.style.display = hidden ? 'flex' : 'none';
  if (hidden) renderRandomPalette();
}

function renderRandomPalette() {
  const container = $('randomPaletteSwatches');
  if (!container) return;
  const baseHue = Math.random() * 360;
  const sat = 55 + Math.random() * 30;
  const lit = 42 + Math.random() * 18;
  const hues = [0, 30, 72, 144, 216].map(o => (baseHue + o) % 360);
  container.innerHTML = '';
  hues.forEach(h => {
    const c = ColorConverter.hslToRgb(h, sat, lit);
    const hex = ColorConverter.toHex(c.r, c.g, c.b);
    const sw = document.createElement('div');
    sw.className = 'random-palette-swatch';
    sw.style.background = hex;
    sw.title = hex.toUpperCase();
    sw.addEventListener('click', () => {
      currentColor = { ...c };
      historyIndex = -1;
      colorHistory.unshift({ ...c, timestamp: Date.now() });
      if (colorHistory.length > 20) colorHistory.pop();
      chrome.storage.local.set({ colorHistory });
      updateColorDisplay(currentColor);
      renderHistory();
      showToast('Loaded ' + hex.toUpperCase(), 'success');
    });
    container.appendChild(sw);
  });
}

// ═══════════════════════════════════════════════════
// FEATURE 6: COLOR TEMPERATURE
// ═══════════════════════════════════════════════════
function getColorTemperature(h) {
  if (h < 60 || h >= 300) return { label: '🔥 Warm', cls: 'temp-warm' };
  if (h < 150) return { label: '🌅 Neutral/Warm', cls: 'temp-neutral-warm' };
  if (h < 240) return { label: '❄️ Cool', cls: 'temp-cool' };
  return { label: '🌙 Neutral/Cool', cls: 'temp-neutral-cool' };
}

// ═══════════════════════════════════════════════════
// FEATURE 4: COLOR COMPARE
// ═══════════════════════════════════════════════════
function toggleCompare() {
  const panel = $('comparePanel');
  const toggle = $('compareToggle');
  if (!panel) return;
  if (panel.style.display === 'none') {
    panel.style.display = '';
    toggle.textContent = 'Compare ▲';
    updateCompare();
  } else {
    panel.style.display = 'none';
    toggle.textContent = 'Compare ▼';
  }
}

function updateCompare() {
  const a = currentColor;
  const b = compareColorB;
  const hexA = ColorConverter.toHex(a.r, a.g, a.b);
  const hexB = ColorConverter.toHex(b.r, b.g, b.b);

  $('compareSwatchA').style.background = hexA;
  $('compareLabelA').textContent = hexA.toUpperCase();
  $('compareNameA').textContent = '≈ ' + ColorNames.findNearest(a.r, a.g, a.b);

  $('compareSwatchB').style.background = hexB;
  $('compareLabelB').textContent = hexB.toUpperCase();
  $('compareNameB').textContent = '≈ ' + ColorNames.findNearest(b.r, b.g, b.b);

  const hslA = ColorConverter._rgbToHslVals(a.r, a.g, a.b);
  const hslB = ColorConverter._rgbToHslVals(b.r, b.g, b.b);
  let hueDiff = Math.abs(hslA.h - hslB.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  const ratio = WCAGChecker.ratio(a, b);

  $('compareStats').innerHTML = `
    <div class="compare-stat"><span>Hue Δ</span><strong>${Math.round(hueDiff)}°</strong></div>
    <div class="compare-stat"><span>Lightness Δ</span><strong>${Math.round(Math.abs(hslA.l - hslB.l))}%</strong></div>
    <div class="compare-stat"><span>Saturation Δ</span><strong>${Math.round(Math.abs(hslA.s - hslB.s))}%</strong></div>
    <div class="compare-stat"><span>Contrast</span><strong>${ratio.toFixed(2)}:1</strong></div>
  `;
}

function swapCompare() {
  const tmp = { ...currentColor };
  currentColor = { ...compareColorB };
  compareColorB = tmp;
  historyIndex = -1;
  updateColorDisplay(currentColor);
  const hexB = ColorConverter.toHex(compareColorB.r, compareColorB.g, compareColorB.b);
  $('compareColorB').value = hexB;
  updateCompare();
}

// ═══════════════════════════════════════════════════
// FEATURE 5: PAGE COLOR AUDIT
// ═══════════════════════════════════════════════════
async function scanPageColors() {
  const btn = $('btnScanPage');
  const status = $('auditStatus');
  const result = $('auditResult');
  btn.disabled = true;
  status.style.display = 'flex';
  result.style.display = 'none';
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id || /^(chrome|about|chrome-extension):/.test(tab.url || '')) {
      showToast('Cannot audit this page', 'error'); return;
    }
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'auditColors' });
    } catch (_) {
      // Content script may not be injected; inject it first
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await new Promise(r => setTimeout(r, 80));
      response = await chrome.tabs.sendMessage(tab.id, { action: 'auditColors' });
    }
    if (response?.colors) {
      const colors = response.colors;
      $('auditCount').textContent = `Found ${colors.length} unique color${colors.length !== 1 ? 's' : ''}`;
      const grid = $('auditGrid');
      grid.innerHTML = '';
      colors.forEach(({ r, g, b }) => {
        const hex = ColorConverter.toHex(r, g, b);
        const item = document.createElement('div');
        item.className = 'audit-swatch-item';
        item.title = hex.toUpperCase();
        const sw = document.createElement('div');
        sw.className = 'audit-swatch';
        sw.style.background = hex;
        const lbl = document.createElement('div');
        lbl.className = 'audit-swatch-label';
        lbl.textContent = hex.toUpperCase();
        item.appendChild(sw);
        item.appendChild(lbl);
        item.addEventListener('click', () => {
          currentColor = { r, g, b };
          historyIndex = -1;
          colorHistory.unshift({ r, g, b, timestamp: Date.now() });
          if (colorHistory.length > 20) colorHistory.pop();
          chrome.storage.local.set({ colorHistory });
          updateColorDisplay(currentColor);
          renderHistory();
          switchTab('picker');
          showToast('Loaded ' + hex.toUpperCase(), 'success');
        });
        grid.appendChild(item);
      });
      result.style.display = '';
    }
  } catch (e) {
    showToast('Scan failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    status.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════
// FEATURE 11: RELATIVE TIME HELPER
// ═══════════════════════════════════════════════════
function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}
