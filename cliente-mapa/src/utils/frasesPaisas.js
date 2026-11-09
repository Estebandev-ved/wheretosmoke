/** Frases cortas del repertorio paisa y tips de la app para la mascota. */
export const FRASES = [
    '¡Quihubo, parce!',
    '¡Eso sí es una chimba!',
    'Todo bien, todo bien, parce.',
    '¡Qué nota de día, mi llave!',
    'Ojo pues, parcero, con el tombo.',
    '¡Dale, que vamos bien!',
    'Uy, qué chimba de racha.',
    '¡Avíspese, parce, que hay misiones!',
    'Tranqui, que más adelante hay spot.',
    '¡Hágale pues, sin miedo!',
    'Ese parche está muy bacano.',
    '¡Qué más, mijo!',
];

export const FRASES_DORMIDA = [
    'Zzz... cinco minuticos más, parce.',
    'Zzz... déjeme soñar con un spot bacano.',
];

export const FRASES_TRISTE = [
    'Se nos fue la racha, parce... hagamos check-in.',
    'Uy, qué pesar. Hoy toca retomar la racha.',
];

export const TIPS = [
    'Tip: haz check-in cada día; la racha da más monedas.',
    'Tip: vota los spots como TOMBO o RELAX para ayudar a la comunidad.',
    'Tip: las misiones diarias se reinician cada día, no las dejes pasar.',
    'Tip: en la tienda hay mascotas que te acompañan en el mapa.',
    'Tip: crea un círculo de confianza para compartir ubicación con tus parceros.',
    'Tip: la ruta de bajo perfil evita zonas calientes.',
    'Tip: sube de nivel para desbloquear artículos nuevos.',
    'Tip: filtra el mapa por estado para ver solo spots tranquilos.',
];

export const REACCIONES = {
    checkin: (d) => `¡Check-in listo! Racha de ${d?.rachaDias ?? 1} ${d?.rachaDias === 1 ? 'día' : 'días'}.`,
    mision: () => '¡Misión cumplida, parce!',
    nivel: (d) => `¡Nivel ${d?.nivel}! Qué berraquera.`,
    compra: () => '¡Qué chimba de artículo!',
    cofre: () => '¡Cofre abierto! A gastar con juicio.',
    horafeliz: () => '¡Hora feliz, parce! Todo vale x2.',
};
