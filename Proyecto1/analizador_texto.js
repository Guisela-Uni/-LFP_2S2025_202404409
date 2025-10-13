import { Lexico } from './lexico.js';
import { extraerAtributos, generarDot } from './utils.js';

//elementos para manipular el DOM
const txtFile = document.getElementById('txtFile'); // id correcto
const textArea = document.getElementById('textArea'); // nombre consistente
const btnAnalizar = document.querySelector('.analizar');
const analisisReporte = document.getElementById('analisisReporte');
const reporteBtn = document.getElementById('btnReporte');
const btnDowland = document.getElementById('dowlandLexico');
const btnDowlandGraphiz = document.getElementById('dowlandGraphiz');

let ultimoReporte =""; // Variable para almacenar el último reporte generado

//cargar archivo de texto
if (txtFile) {
    txtFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            textArea.value = e.target.result;
        };
        reader.readAsText(file);
    });
}

//funcion para analizar el texto
btnAnalizar.addEventListener('click', function () {
    
    //utilizo el texto del textarea previamente cargado
    const texto = textArea.value.trim();
    
    //valida que no este vacio
    if (texto === "") {
        alert("No se ha cargado nungún archivo, porfavor cargue uno.");
        return;
    }

    //crea el analizador lexico
    try{
        const lexico = new Lexico(texto); //crear instancia de Lexico
        lexico.analizar();

                //generar el reporte html en forma de tabla
                let reporteHTML =`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reporte de Tokens</title>
                <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        h1 { color: #16bb89ff; font-size: 33px; font-family: 'Times New Roman', Times, serif; }
                        h2 { color: #30c3b7ff; font-size: 26px; font-family: 'Times New Roman', Times, serif;}
                        .ok { color: #6dca2aff; font-weight: bold; }
                        .error { color: red; font-weight: bold; }
                </style>
                </head>
                <body>
                <h1>Reporte de Tokens</h1>

                <h2>Lista de Tokens</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Tipo</th>
                            <th>Lexema</th>
                            <th>Línea</th>
                            <th>Columna</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                lexico.tokens.forEach((toky, i) => {
                        reporteHTML += `
                            <tr class="ok">
                                <td>${i+1}</td>
                                <td>${toky.tipo}</td>
                                <td>'${toky.lexema}'</td>
                                <td>${toky.linea}</td>
                                <td>${toky.columna}</td>
                            </tr>
                        `;
                });
                if(lexico.tokens.length === 0){
                        reporteHTML += `<tr><td colspan="5">No se encontraron tokens.</td></tr>`;
                }
                reporteHTML += `
                    </tbody>
                </table>

                <h2>Lista de Errores</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Lexema</th>
                            <th>Línea</th>
                            <th>Columna</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                lexico.errores.forEach((err, i) => {
                        reporteHTML += `
                            <tr class="error">
                                <td>${i+1}</td>
                                <td>'${err.lexema}'</td>
                                <td>${err.linea}</td>
                                <td>${err.columna}</td>
                                <td>${err.descripcion}</td>
                            </tr>
                        `;
                });
                if(lexico.errores.length === 0){
                        reporteHTML += `<tr><td colspan="5">No se encontraron errores.</td></tr>`;
                }
                reporteHTML += `
                    </tbody>
                </table>
                </body>
                </html>
                `;

        //guarda el html para descargarlo
        ultimoReporte = reporteHTML;

        analisisReporte.textContent ="reporte generado correctamente, puede descargarlo.";
    }catch(error){
        analisisReporte.textContent ="Ocurrió un error durante el análisis:\n" + error.message;
        console.error("Error  el análisis:", error);
    }

})
//funcion para descargar el reporte
btnDowland.addEventListener('click', function () {
    if (ultimoReporte === "") {
        alert("No se ha generado ningún reporte para descargar.");
        return;
    }

    const blob = new Blob([ultimoReporte], { type: 'text/html' });
    const url = URL.createObjectURL(blob); // Crear una URL para el Blob

    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_tokens.html';
    a.click();
    URL.revokeObjectURL(url); // Liberar la URL creada
});

btnDowlandGraphiz.addEventListener('click', function () {
    const texto = textArea.value.trim();
    if (texto === "") {
        alert("No se ha cargado nungún archivo, porfavor cargue uno.");
        return;
    }

    try{
        const lexico = new Lexico(texto); // Crear instancia de Lexico
        const { tokens } = lexico.analizar(); // Obtener tokens

        const atributos = extraerAtributos(tokens); // Extraer pares atributo-valor
        const dot = generarDot(atributos); // Generar código DOT con los atributos

        const blob = new Blob([dot], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'torneo_graphiz.txt';
        a.click();

        URL.revokeObjectURL(url); // Liberar la URL creada

    } catch(error){
        console.error("Error  al generar el graphviz:", error);
        alert("Ocurrió un error al generar el archivo Graphviz:\n" + error.message);
    }
})

reporteBtn.addEventListener('click', function () {
    const texto = textArea.value.trim();
    if (texto === "") {
        alert("No se ha cargado ningún archivo, por favor cargue uno.");
        return;
    }

    const resumen = document.getElementById("tablaResumen");
    const fases = document.getElementById("tablaFases");

    procesarEliminacion(texto, resumen, fases);
});