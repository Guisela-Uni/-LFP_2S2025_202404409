import { Lexico } from './lexico.js';
import { AtributosValidos } from './token.js';

// Función para extraer pares atributo-valor
function extraerAtributos(tokens) {
    const atributos = {};
    for (let i = 0; i < tokens.length - 1; i++) {
        const actual = tokens[i];
        const siguiente = tokens[i + 1];

        if (actual.tipo === "ATRIBUTO" && 
            (siguiente.tipo === "CADENA" || siguiente.tipo === "NUMERO")) {
            if (!atributos[actual.lexema]) atributos[actual.lexema] = [];
            atributos[actual.lexema].push(siguiente.lexema);
        }
    }
    return atributos;
}

// Función para crear tabla resumen del torneo
function crearTablaResumen(atributos) {
    const nombre = atributos["nombre"]?.[0] || "No definido";
    const sede = atributos["sede"]?.[0] || "No definida";
    const equipos = atributos["equipos"]?.length || 0;
    const partidos = atributos["vs"]?.length || 0;
    const goles = atributos["goleadores"]?.length || 0;

    let fase = "No definida";
    if (atributos["final"]) fase = "Final";
    else if (atributos["semifinal"]) fase = "Semifinal";
    else if (atributos["cuartos"]) fase = "Cuartos";

    return `
        <table border="1">
            <thead>
                <tr><th colspan="2">Resumen del Torneo</th></tr>
            </thead>
            <tbody>
                <tr><td> Nombre</td><td>${nombre}</td></tr>
                <tr><td> Sede</td><td>${sede}</td></tr>
                <tr><td> Equipos</td><td>${equipos}</td></tr>
                <tr><td> Partidos</td><td>${partidos}</td></tr>
                <tr><td> Goles</td><td>${goles}</td></tr>
                <tr><td> Fase Actual</td><td>${fase}</td></tr>
            </tbody>
        </table>
    `;
}

// Función para crear tabla de fases
function crearTablaFases(atributos) {
    const fases = ["cuartos", "semifinal", "final"];
    let html = `
        <table border="1">
            <thead>
                <tr>
                    <th>Fase</th>
                    <th>Equipos</th>
                    <th>Resultado</th>
                    <th>Ganador</th>
                </tr>
            </thead>
            <tbody>
    `;

    fases.forEach(fase => {
        const partidos = atributos[fase] || [];
        partidos.forEach((partido, i) => {
            const equipos = atributos["vs"]?.[i] || "No definido";
            const resultado = atributos["resultado"]?.[i] || "No definido";
            const ganador = atributos["goleador"]?.[i] || "No definido";

            html += `
                <tr>
                    <td>${fase.charAt(0).toUpperCase() + fase.slice(1)}</td>
                    <td>${equipos}</td>
                    <td>${resultado}</td>
                    <td>${ganador}</td>
                </tr>
            `;
        });
    });

    html += `</tbody></table>`;
    return html;
}

// Función principal para procesar texto y mostrar tablas
export function procesarEliminacion(texto, contenedorResumen, contenedorFases) {
    const lexico = new Lexico(texto);
    const { tokens } = lexico.analizar();
    const atributos = extraerAtributos(tokens);

    const tablaResumen = crearTablaResumen(atributos);
    const tablaFases = crearTablaFases(atributos);

    contenedorResumen.innerHTML = tablaResumen;
    contenedorFases.innerHTML = tablaFases;
}
const texto = textArea.value.trim();
const resumen = document.getElementById("tablaResumen");
const fases = document.getElementById("tablaFases");
procesarEliminacion(texto, resumen, fases);
