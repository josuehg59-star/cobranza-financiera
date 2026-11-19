const crypto = require('crypto');

const MASTER_DEV = {
  nombre: "Josue Hernandez",
  telefono: "9612765041",
  whatsapp: "https://wa.me/529612765041"
};

const MASTER_SECRET = "JOSUE_HERNANDEZ_NEXUS_KEY_9612765041";

// Generar serial criptográfico
// formato: NEXUS-JH-{rutas}M-{exp}-{checksum}
// ej: NEXUS-JH-5M-20261231-A89F4B
function generarSerialLicencia(empresa, rutas, tipo, diasValidez = 30) {
  const rutasNum = Math.max(1, Math.min(50, Number(rutas) || 1));
  let expStr = "VITALICIA";

  if (tipo !== "VITALICIA") {
    const d = new Date();
    d.setDate(d.getDate() + (Number(diasValidez) || 30));
    expStr = d.toISOString().split('T')[0].replace(/-/g, ''); // ej. 20261218
  }

  const payload = `${empresa.trim().toUpperCase()}|${rutasNum}|${expStr}|${MASTER_SECRET}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();

  const serial = `NEXUS-JH-${rutasNum}M-${expStr}-${hash}`;

  return {
    serial,
    empresa: empresa.trim(),
    rutasPermitidas: rutasNum,
    expira: expStr,
    tipo: tipo || "MENSUAL",
    creador: MASTER_DEV.nombre,
    telefonoSoporte: MASTER_DEV.telefono
  };
}

// Validar serial
function validarSerialLicencia(serial, empresa) {
  if (!serial || typeof serial !== 'string') return { valida: false, error: 'Serial no proporcionado' };

  const partes = serial.trim().split('-');
  if (partes.length !== 5 || partes[0] !== 'NEXUS' || partes[1] !== 'JH') {
    return { valida: false, error: 'Formato de serial inválido' };
  }

  const rutasStr = partes[2]; // ej. "3M"
  const expStr = partes[3];   // ej. "20261218" o "VITALICIA"
  const hashRecibido = partes[4];

  const rutasNum = parseInt(rutasStr.replace('M', ''), 10);
  if (isNaN(rutasNum) || rutasNum < 1) {
    return { valida: false, error: 'Número de rutas no válido' };
  }

  // Verificar fecha de expiración si no es vitalicia
  if (expStr !== 'VITALICIA') {
    const year = parseInt(expStr.substring(0, 4), 10);
    const month = parseInt(expStr.substring(4, 6), 10) - 1;
    const day = parseInt(expStr.substring(6, 8), 10);
    const expDate = new Date(year, month, day, 23, 59, 59);

    if (new Date() > expDate) {
      return {
        valida: false,
        expirada: true,
        error: 'Tu licencia o mensualidad ha vencido. Contacta a Josue Hernandez al 961 276 5041 para reactivar tu servicio.',
        telefonoSoporte: MASTER_DEV.telefono
      };
    }
  }

  const payload = `${empresa.trim().toUpperCase()}|${rutasNum}|${expStr}|${MASTER_SECRET}`;
  const hashEsperado = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();

  if (hashRecibido !== hashEsperado) {
    return { valida: false, error: 'El serial no coincide con el nombre de esta empresa' };
  }

  return {
    valida: true,
    empresa: empresa.trim(),
    rutasPermitidas: rutasNum,
    expira: expStr,
    creador: MASTER_DEV.nombre,
    telefonoSoporte: MASTER_DEV.telefono
  };
}

module.exports = {
  MASTER_DEV,
  generarSerialLicencia,
  validarSerialLicencia
};
