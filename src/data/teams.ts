// Utilidad para convertir código de país a emoji de bandera
function toFlag(code: string): string {
  if (!code || code.length !== 2) return "⚽"; // Balón como fallback
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

export interface Team {
  id: string;
  name: string;
  flag: string;  // Emoji directo
  flagCode: string; // Código ISO 3166-1 alpha-2 para flag-icons
}

// Bandera pre-calculadas
const mx = toFlag('MX');  // 🇲🇽
const za = toFlag('ZA');  // 🇿🇦
const kr = toFlag('KR');  // 🇰🇷
const cz = toFlag('CZ');  // 🇨🇿
const ca = toFlag('CA');  // 🇨🇦
const ba = toFlag('BA');  // 🇧🇦
const qa = toFlag('QA');  // 🇶🇦
const ch = toFlag('CH');  // 🇨🇭
const br = toFlag('BR');  // 🇧🇷
const ma = toFlag('MA');  // 🇲🇦
const ht = toFlag('HT');  // 🇭🇹
const us = toFlag('US');  // 🇺🇸
const py = toFlag('PY');  // 🇵🇾
const au = toFlag('AU');  // 🇦🇺
const tr = toFlag('TR');  // 🇹🇷
const de = toFlag('DE');  // 🇩🇪
const cw = toFlag('CW');  // 🇨🇼
const ci = toFlag('CI');  // 🇨🇮
const ec = toFlag('EC');  // 🇪🇨
const nl = toFlag('NL');  // 🇳🇱
const jp = toFlag('JP');  // 🇯🇵
const se = toFlag('SE');  // 🇸🇪
const tn = toFlag('TN');  // 🇹🇳
const be = toFlag('BE');  // 🇧🇪
const eg = toFlag('EG');  // 🇪🇬
const ir = toFlag('IR');  // 🇮🇷
const nz = toFlag('NZ');  // 🇳🇿
const es = toFlag('ES');  // 🇪🇸
const cv = toFlag('CV');  // 🇨🇻
const sa = toFlag('SA');  // 🇸🇦
const uy = toFlag('UY');  // 🇺🇾
const fr = toFlag('FR');  // 🇫🇷
const sn = toFlag('SN');  // 🇸🇳
const iq = toFlag('IQ');  // 🇮🇶
const no = toFlag('NO');  // 🇳🇴
const ar = toFlag('AR');  // 🇦🇷
const dz = toFlag('DZ');  // 🇩🇿
const at = toFlag('AT');  // 🇦🇹
const jo = toFlag('JO');  // 🇯🇴
const pt = toFlag('PT');  // 🇵🇹
const cd = toFlag('CD');  // 🇨🇩
const uz = toFlag('UZ');  // 🇺🇿
const co = toFlag('CO');  // 🇨🇴
const hr = toFlag('HR');  // 🇭🇷
const gh = toFlag('GH');  // 🇬🇭
const pa = toFlag('PA');  // 🇵🇦
const gb = toFlag('GB');  // 🇬🇧

const FLAG_CODES: Record<string, string> = {
  mex: 'mx', rsa: 'za', kor: 'kr', cze: 'cz', czec: 'cz',
  can: 'ca', bih: 'ba', bih2: 'ba', qat: 'qa', sui: 'ch',
  bra: 'br', mar: 'ma', hai: 'ht', sco: 'gb-sct',
  usu: 'us', par: 'py', aus: 'au', tur: 'tr',
  ale: 'de', cur: 'cw', civ: 'ci', ecu: 'ec',
  net: 'nl', jap: 'jp', sue: 'se', tun: 'tn',
  bel: 'be', egi: 'eg', ira: 'ir', nze: 'nz',
  esp: 'es', cve: 'cv', ksa: 'sa', uru: 'uy',
  fra: 'fr', sen: 'sn', ira2: 'iq', nor: 'no',
  arg: 'ar', alg: 'dz', aus2: 'at', jor: 'jo',
  por: 'pt', cod: 'cd', uzb: 'uz', col: 'co',
  eng: 'gb-eng', cro: 'hr', gha: 'gh', pan: 'pa',
}

// Asigna flagCode a cada equipo basado en su id
function getFlagCodeByTeamId(teamId: string): string {
  return FLAG_CODES[teamId] || teamId.slice(0, 2)
}

// Obtiene flagCode por nombre o id de equipo
export function getFlagCode(teamName: string | null | undefined): string | null {
  const team = findTeam(teamName);
  if (!team) return null;
  return team.flagCode;
}

export const ALL_TEAMS: Team[] = [
  // GRUPO A
  { id: 'mex', name: 'México', flag: mx, flagCode: getFlagCodeByTeamId('mex') },
  { id: 'rsa', name: 'Sudáfrica', flag: za, flagCode: getFlagCodeByTeamId('rsa') },
  { id: 'kor', name: 'Corea del Sur', flag: kr, flagCode: getFlagCodeByTeamId('kor') },
  { id: 'cze', name: 'Rep. Checa', flag: cz, flagCode: getFlagCodeByTeamId('cze') },
  { id: 'czec', name: 'República Checa', flag: cz, flagCode: getFlagCodeByTeamId('czec') },
  
  // GRUPO B
  { id: 'can', name: 'Canadá', flag: ca, flagCode: getFlagCodeByTeamId('can') },
  { id: 'bih', name: 'Bosnia y Herz.', flag: ba, flagCode: getFlagCodeByTeamId('bih') },
  { id: 'bih2', name: 'Bosnia y Herzegovina', flag: ba, flagCode: getFlagCodeByTeamId('bih2') },
  { id: 'qat', name: 'Qatar', flag: qa, flagCode: getFlagCodeByTeamId('qat') },
  { id: 'sui', name: 'Suiza', flag: ch, flagCode: getFlagCodeByTeamId('sui') },
  
  // GRUPO C
  { id: 'bra', name: 'Brasil', flag: br, flagCode: getFlagCodeByTeamId('bra') },
  { id: 'mar', name: 'Marruecos', flag: ma, flagCode: getFlagCodeByTeamId('mar') },
  { id: 'hai', name: 'Haití', flag: ht, flagCode: getFlagCodeByTeamId('hai') },
  { id: 'sco', name: 'Escocia', flag: gb, flagCode: getFlagCodeByTeamId('sco') },
  
  // GRUPO D
  { id: 'usu', name: 'EE.UU.', flag: us, flagCode: getFlagCodeByTeamId('usu') },
  { id: 'par', name: 'Paraguay', flag: py, flagCode: getFlagCodeByTeamId('par') },
  { id: 'aus', name: 'Australia', flag: au, flagCode: getFlagCodeByTeamId('aus') },
  { id: 'tur', name: 'Turquía', flag: tr, flagCode: getFlagCodeByTeamId('tur') },
  
  // GRUPO E
  { id: 'ale', name: 'Alemania', flag: de, flagCode: getFlagCodeByTeamId('ale') },
  { id: 'cur', name: 'Curazao', flag: cw, flagCode: getFlagCodeByTeamId('cur') },
  { id: 'civ', name: 'Costa de Marfil', flag: ci, flagCode: getFlagCodeByTeamId('civ') },
  { id: 'ecu', name: 'Ecuador', flag: ec, flagCode: getFlagCodeByTeamId('ecu') },
  
  // GRUPO F
  { id: 'net', name: 'Países Bajos', flag: nl, flagCode: getFlagCodeByTeamId('net') },
  { id: 'jap', name: 'Japón', flag: jp, flagCode: getFlagCodeByTeamId('jap') },
  { id: 'sue', name: 'Suecia', flag: se, flagCode: getFlagCodeByTeamId('sue') },
  { id: 'tun', name: 'Túnez', flag: tn, flagCode: getFlagCodeByTeamId('tun') },
  
  // GRUPO G
  { id: 'bel', name: 'Bélgica', flag: be, flagCode: getFlagCodeByTeamId('bel') },
  { id: 'egi', name: 'Egipto', flag: eg, flagCode: getFlagCodeByTeamId('egi') },
  { id: 'ira', name: 'Irán', flag: ir, flagCode: getFlagCodeByTeamId('ira') },
  { id: 'nze', name: 'Nueva Zelanda', flag: nz, flagCode: getFlagCodeByTeamId('nze') },
    
  // GRUPO H
  { id: 'esp', name: 'España', flag: es, flagCode: getFlagCodeByTeamId('esp') },
  { id: 'cve', name: 'Cabo Verde', flag: cv, flagCode: getFlagCodeByTeamId('cve') },
  { id: 'ksa', name: 'Arabia Saudita', flag: sa, flagCode: getFlagCodeByTeamId('ksa') },
  { id: 'uru', name: 'Uruguay', flag: uy, flagCode: getFlagCodeByTeamId('uru') },
  
  // GRUPO I
  { id: 'fra', name: 'Francia', flag: fr, flagCode: getFlagCodeByTeamId('fra') },
  { id: 'sen', name: 'Senegal', flag: sn, flagCode: getFlagCodeByTeamId('sen') },
  { id: 'ira2', name: 'Irak', flag: iq, flagCode: getFlagCodeByTeamId('ira2') },
  { id: 'nor', name: 'Noruega', flag: no, flagCode: getFlagCodeByTeamId('nor') },
  
  // GRUPO J
  { id: 'arg', name: 'Argentina', flag: ar, flagCode: getFlagCodeByTeamId('arg') },
  { id: 'alg', name: 'Argelia', flag: dz, flagCode: getFlagCodeByTeamId('alg') },
  { id: 'aus2', name: 'Austria', flag: at, flagCode: getFlagCodeByTeamId('aus2') },
  { id: 'jor', name: 'Jordania', flag: jo, flagCode: getFlagCodeByTeamId('jor') },
  
  // GRUPO K
  { id: 'por', name: 'Portugal', flag: pt, flagCode: getFlagCodeByTeamId('por') },
  { id: 'cod', name: 'R.D. del Congo', flag: cd, flagCode: getFlagCodeByTeamId('cod') },
  { id: 'uzb', name: 'Uzbekistán', flag: uz, flagCode: getFlagCodeByTeamId('uzb') },
  { id: 'col', name: 'Colombia', flag: co, flagCode: getFlagCodeByTeamId('col') },
  
  // GRUPO L
  { id: 'eng', name: 'Inglaterra', flag: gb, flagCode: getFlagCodeByTeamId('eng') },
  { id: 'cro', name: 'Croacia', flag: hr, flagCode: getFlagCodeByTeamId('cro') },
  { id: 'gha', name: 'Ghana', flag: gh, flagCode: getFlagCodeByTeamId('gha') },
  { id: 'pan', name: 'Panamá', flag: pa, flagCode: getFlagCodeByTeamId('pan') },
];

// Busca un equipo por nombre o id (normalizado)
function findTeam(key: string | null | undefined): Team | undefined {
  if (!key) return undefined;
  const n = key.trim().toLowerCase();
  return ALL_TEAMS.find(t => t.name.trim().toLowerCase() === n || t.id.toLowerCase() === n);
}

// Función auxiliar para obtener bandera emoji por nombre o id
export function getTeamFlag(teamName: string | null | undefined): string {
  const team = findTeam(teamName);
  return team?.flag || "⚽";
}


