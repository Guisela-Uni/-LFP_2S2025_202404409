let archivoSeleccionado = null // Variable global para almacenar el archivo seleccionado

//capturar el archivo seleccionado
document.querySelector("#txtFile").addEventListener("change", function(event) {
    archivoSeleccionado = event.target.files[0];
});

// Al presionar el botón, se analiza el archivo
document.querySelector(".presionar").addEventListener("click", function() {
    if (archivoSeleccionado) {
        leerTXT(archivoSeleccionado);
    } else {
        alert("Primero selecciona un archivo.");
    }
});



//funcion para leer el archivo txt
function leerTXT(archivo) {
    const lector = new FileReader();
    lector.onload = function(e) {
        const contenido = e.target.result;
        const datos = procesarTorneo(contenido);
        mostrarYDescargarReporte(datos);

    };
    lector.readAsText(archivo);
    }
    

// Procesar el contenido del torneo
function procesarTorneo(texto) {
    const torneo = {};
    const equipos = {};
    const estadisticas = {};
    const fases = [];
    const goleadores = [];

    // TORNEO
    const torneoMatch = texto.match(/TORNEO\s*{([^}]+)}/);
    if (torneoMatch) {
        const info = torneoMatch[1];
        torneo.nombre = info.match(/nombre:\s*"(.+?)"/)?.[1] || "Sin nombre";
        torneo.sede = info.match(/sede:\s*"(.+?)"/)?.[1] || "Sin sede";
        torneo.equipos = parseInt(info.match(/equipos:\s*(\d+)/)?.[1]) || 0;
    }

    // EQUIPOS
    const equiposMatch = [...texto.matchAll(/equipo:\s*"(.+?)"\s*\[\s*((?:.|\n)*?)\];/g)];
    equiposMatch.forEach(e => {
        const nombre = e[1];
        const jugadoresTexto = e[2];
        const jugadores = [...jugadoresTexto.matchAll(/jugador:\s*"(.+?)"\s*\[posicion:\s*"(.+?)",\s*numero:\s*(\d+),\s*edad:\s*(\d+)\]/g)]
        .map(j => ({
            nombre: j[1],
            posicion: j[2],
            numero: +j[3],
            edad: +j[4]
        }));
        equipos[nombre] = jugadores;
        estadisticas[nombre] = { jugados: 0, ganados: 0, perdidos: 0 };
    });

    // ELIMINACION
    const fasesMatch = [...texto.matchAll(/(\w+):\s*\[\s*((?:.|\n)*?)\];/g)];
    fasesMatch.forEach(f => {
        const fase = f[1];
        const contenido = f[2];
        const partidos = [...contenido.matchAll(/partido:\s*"(.+?)"\s+vs\s+"(.+?)"\s*\[\s*resultado:\s*"(\d+)-(\d+)",\s*goleadores:\s*\[((?:.|\n)*?)\]\s*\]/g)];
        partidos.forEach(p => {
        const [_, eq1, eq2, g1, g2, golesTexto] = p;
        const goles1 = parseInt(g1), goles2 = parseInt(g2);
        const ganador = goles1 > goles2 ? eq1 : eq2;

        fases.push({ fase, equipo1: eq1, equipo2: eq2, goles1, goles2, ganador });

        estadisticas[eq1].jugados++;
        estadisticas[eq2].jugados++;
        estadisticas[ganador].ganados++;
        estadisticas[ganador === eq1 ? eq2 : eq1].perdidos++;

        const goles = [...golesTexto.matchAll(/goleador:\s*"(.+?)"\s*\[minuto:\s*(\d+)\]/g)];
        goles.forEach(g => {
            const nombre = g[1];
            const minuto = parseInt(g[2]);
            const jugador = equipos[ganador]?.find(j => j.nombre === nombre);
            goleadores.push({
            nombre,
            minuto,
            equipo: ganador,
            posicion: jugador?.posicion || "Desconocida"
            });
        });
        });
    });

    // Contar goles por jugador
    goleadores.forEach(g => {
        g.goles = goleadores.filter(x => x.nombre === g.nombre).length;
    });

    return { torneo, equipos, fases, estadisticas, goleadores };
    }

function mostrarYDescargarReporte({ torneo, fases, estadisticas, goleadores }) {
    let html = `
        <h1>${torneo.nombre}</h1>
        <p><strong>Sede:</strong> ${torneo.sede}</p>
        <p><strong>Equipos participantes:</strong> ${torneo.equipos}</p>

        <h2> Fases del Torneo</h2>
        <table border='1'><tr><th>Fase</th><th>Partido</th><th>Resultado</th><th>Ganador</th></tr>
    `;

    fases.forEach(f => {
        html += `<tr><td>${f.fase}</td><td>${f.equipo1} vs ${f.equipo2}</td><td>${f.goles1}-${f.goles2}</td><td>${f.ganador}</td></tr>`;
    });

    html += `</table>
        <h2> Estadísticas por Equipo</h2>
        <table border='1'><tr><th>Equipo</th><th>Jugados</th><th>Ganados</th><th>Perdidos</th></tr>
    `;

    for (const [equipo, est] of Object.entries(estadisticas)) {
        html += `<tr><td>${equipo}</td><td>${est.jugados}</td><td>${est.ganados}</td><td>${est.perdidos}</td></tr>`;
    }

    html += `</table>
        <h2> Goleadores</h2>
        <table border='1'><tr><th>Jugador</th><th>Posición</th><th>Equipo</th><th>Goles</th><th>Minuto</th></tr>
    `;

    goleadores.forEach(g => {
        html += `<tr><td>${g.nombre}</td><td>${g.posicion}</td><td>${g.equipo}</td><td>${g.goles}</td><td>${g.minuto}</td></tr>`;
    });

    html += `</table>`;

    // Mostrar en el HTML actual
    document.getElementById("reporte").innerHTML = html;

    // Descargar como archivo HTML
    const archivoHTML = `
        <html><head><title>${torneo.nombre}</title></head><body>${html}</body></html>
    `;
    const blob = new Blob([archivoHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "Reportes.html";
    enlace.click();
    URL.revokeObjectURL(url);
}