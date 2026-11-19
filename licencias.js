const crypto = require('crypto');

const MASTER_DEV = {
  nombre: "Josue Hernandez",
  telefono: "9612765041",
  whatsapp: "https://wa.me/529612765041"
};

const MASTER_SECRET = "JOSUE_HERNANDEZ_NEXUS_KEY_9612765041";

function normalizarTexto(txt) {
  if (!txt) return "";
  return txt.trim().toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
}

// Generar serial criptográfico oficial
function generarSerialLicencia(empresa, rutas, tipo, diasValidez = 30) {
  const empNorm = normalizarTexto(empresa);
  const rutasNum = Math.max(1, Math.min(50, Number(rutas) || 1));
  let expStr = "VITALICIA";

  if (tipo !== "VITALICIA") {
    const d = new Date();
    d.setDate(d.getDate() + (Number(diasValidez) || 30));
    expStr = d.toISOString().split('T')[0].replace(/-/g, '');
  }

  const payload = `${empNorm}|${rutasNum}|${expStr}|${MASTER_SECRET}`;
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

// Validar serial y calcular días restantes
function validarSerialLicencia(serial, empresa) {
  if (!serial || typeof serial !== 'string') {
    return { valida: false, error: 'Serial no proporcionado' };
  }

  const partes = serial.trim().split('-');
  if (partes.length !== 5 || partes[0] !== 'NEXUS' || partes[1] !== 'JH') {
    return { valida: false, error: 'Formato de serial inválido. Debe comenzar con NEXUS-JH-' };
  }

  const rutasStr = partes[2];
  const expStr = partes[3];
  const hashRecibido = partes[4];

  const rutasNum = parseInt(rutasStr.replace('M', ''), 10);
  if (isNaN(rutasNum) || rutasNum < 1) {
    return { valida: false, error: 'Número de rutas no válido en el serial' };
  }

  let diasRestantes = 9999;
  let fechaLegible = "Vitalicia / Permanente";
  let expirada = false;

  if (expStr !== 'VITALICIA') {
    const year = parseInt(expStr.substring(0, 4), 10);
    const month = parseInt(expStr.substring(4, 6), 10) - 1;
    const day = parseInt(expStr.substring(6, 8), 10);
    const expDate = new Date(year, month, day, 23, 59, 59);
    const hoy = new Date();

    fechaLegible = `${day}/${month + 1}/${year}`;
    const diffTime = expDate - hoy;
    diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) {
      expirada = true;
      diasRestantes = 0;
    }
  }

  const empNorm = normalizarTexto(empresa);
  const payload = `${empNorm}|${rutasNum}|${expStr}|${MASTER_SECRET}`;
  const hashEsperado = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();

  if (hashRecibido !== hashEsperado) {
    return {
      valida: false,
      error: `El serial no coincide con el nombre de esta empresa ("${empresa}").`
    };
  }

  return {
    valida: !expirada,
    expirada,
    empresa: empresa.trim(),
    rutasPermitidas: rutasNum,
    expira: expStr,
    fechaLegible,
    diasRestantes,
    creador: MASTER_DEV.nombre,
    telefonoSoporte: MASTER_DEV.telefono
  };
}

// Chequeo completo de estado (Soporte Modo Prueba 7 Días)
function evaluarEstadoLicencia(db) {
  const empresa = db.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";
  const hoy = new Date();

  // Si tiene un serial activado
  if (db.licencia && db.licencia.serial) {
    const val = validarSerialLicencia(db.licencia.serial, empresa);
    if (!val.valida) {
      // Intentar fallback si cambió acentos
      const valLimpia = validarSerialLicencia(db.licencia.serial, "FINANCIERA CREDITO FACIL");
      if (valLimpia.valida) return { ...valLimpia, estado: 'ACTIVA', tipoLicencia: 'OFICIAL' };

      return {
        ...val,
        estado: val.expirada ? 'BLOQUEADA_VENCIDA' : 'BLOQUEADA_INVALIDA',
        tipoLicencia: 'OFICIAL',
        mensajeBloqueo: val.expirada ?
          '🔒 Tu mensualidad o licencia ha vencido. Contacta a Josue Hernandez al 961 276 5041 para reactivar tu servicio.' :
          '🔒 Licencia inválida para esta empresa. Contacta a Josue Hernandez al 961 276 5041.'
      };
    }
    return {
      ...val,
      estado: 'ACTIVA',
      tipoLicencia: 'OFICIAL'
    };
  }

  // Si NO tiene serial: Activar Modo de Prueba 7 Días
  if (!db.pruebaGratis) {
    const finPrueba = new Date();
    finPrueba.setDate(finPrueba.getDate() + 7);
    db.pruebaGratis = {
      iniciadaEl: hoy.toISOString(),
      venceEl: finPrueba.toISOString(),
      diasTotal: 7
    };
  }

  const venceDate = new Date(db.pruebaGratis.venceEl);
  const diffTime = venceDate - hoy;
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime <= 0) {
    return {
      valida: false,
      expirada: true,
      estado: 'BLOQUEADA_PRUEBA_VENCIDA',
      tipoLicencia: 'PRUEBA',
      diasRestantes: 0,
      rutasPermitidas: 1,
      fechaLegible: venceDate.toLocaleDateString('es-MX'),
      mensajeBloqueo: '🔒 Tu periodo de prueba gratuita de 7 días ha finalizado. Para continuar operando y desbloquear tus datos, activa tu licencia con Josue Hernandez (961 276 5041).',
      creador: MASTER_DEV.nombre,
      telefonoSoporte: MASTER_DEV.telefono
    };
  }

  return {
    valida: true,
    expirada: false,
    estado: 'MODO_PRUEBA',
    tipoLicencia: 'PRUEBA',
    diasRestantes,
    rutasPermitidas: 2, // 2 cobradores de prueba
    fechaLegible: venceDate.toLocaleDateString('es-MX'),
    creador: MASTER_DEV.nombre,
    telefonoSoporte: MASTER_DEV.telefono
  };
}

module.exports = {
  MASTER_DEV,
  generarSerialLicencia,
  validarSerialLicencia,
  evaluarEstadoLicencia,
  normalizarTexto
};
