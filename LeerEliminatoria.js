let archivoSeleccionado = null;

document.getElementById("txtFile").addEventListener("change", e => {
  archivoSeleccionado = e.target.files[0];
});

document.querySelector(".presionar").addEventListener("click", () => {
  if (!archivoSeleccionado) {
    alert("Por favor selecciona un archivo primero.");
    return;
  }
  alert(" ¡Archivo leido correctamente! 🥳");
  leerArchivo(archivoSeleccionado);
});

function leerArchivo(archivo) {
  const lector = new FileReader();
  lector.onload = e => {
    const texto = e.target.result;
    procesarTexto(texto);
  };
  lector.readAsText(archivo);
}

function procesarTexto(texto) {
  // Extraer TORNEO
  const torneo = {};
  const torneoMatch = texto.match(/TORNEO\s*{([\s\S]*?)}/i);
  if (torneoMatch) {
    const contenido = torneoMatch[1];
    torneo.nombre = extraerValor(contenido, "nombre");
    torneo.equipos = parseInt(extraerValor(contenido, "equipos"));
    torneo.sede = extraerValor(contenido, "sede");
  }

  // Extraer EQUIPOS
  const equipos = [];
  const equiposMatch = texto.match(/EQUIPOS\s*{([\s\S]*?)}/i);
  if (equiposMatch) {
    const contenido = equiposMatch[1];
    // Extraer cada equipo con su bloque de jugadores
    const regexEquipo = /equipo:\s*"([^"]+)"\s*\[([\s\S]*?)\];/gi;
    let match;
    while ((match = regexEquipo.exec(contenido)) !== null) {
      const nombreEquipo = match[1];
      const jugadoresStr = match[2];
      const jugadores = [];
      // Extraer jugadores
      const regexJugador = /jugador:\s*"([^"]+)"\s*\[([^\]]+)\],?/gi;
      let mJugador;
      while ((mJugador = regexJugador.exec(jugadoresStr)) !== null) {
        const nombreJugador = mJugador[1];
        const attrsStr = mJugador[2];
        const posicion = extraerValor(attrsStr, "posicion");
        const numero = parseInt(extraerValor(attrsStr, "numero"));
        const edad = parseInt(extraerValor(attrsStr, "edad"));
        jugadores.push({ nombre: nombreJugador, posicion, numero, edad });
      }
      equipos.push({ nombre: nombreEquipo, jugadores });
    }
  }

  // Extraer ELIMINACION
  const eliminacion = {};
  const elimMatch = texto.match(/ELIMINACION\s*{([\s\S]*?)}/i);
  if (elimMatch) {
    const contenido = elimMatch[1];
    // Extraer fases (cuartos, semifinal, etc)
    const regexFase = /(\w+):\s*\[([\s\S]*?)\];/gi;
    let mFase;
    while ((mFase = regexFase.exec(contenido)) !== null) {
      const fase = mFase[1];
      const partidosStr = mFase[2];
      const partidos = [];
      // Extraer partidos dentro de la fase
      const regexPartido = /partido:\s*"([^"]+)"\s*vs\s*"([^"]+)"\s*\[([\s\S]*?)\]/gi;
      let mPartido;
      while ((mPartido = regexPartido.exec(partidosStr)) !== null) {
        const equipo1 = mPartido[1];
        const equipo2 = mPartido[2];
        const detallesStr = mPartido[3];

        // Extraer resultado
        const resultado = extraerValor(detallesStr, "resultado");

        // Extraer bloque goleadores: [ ... ]
        const goleadores = [];
        const goleadoresMatch = detallesStr.match(/goleadores:\s*\[([\s\S]*?)\]/i);
        if (goleadoresMatch) {
          const goleadoresStr = goleadoresMatch[1];
          // Extraer cada goleador dentro del bloque
          const regexGoleador = /goleador:\s*"([^"]+)"\s*\[minuto:\s*(\d+)\],?/gi;
          let mGol;
          while ((mGol = regexGoleador.exec(goleadoresStr)) !== null) {
            goleadores.push({ jugador: mGol[1], minuto: parseInt(mGol[2]) });
          }
        }

        partidos.push({ equipo1, equipo2, resultado, goleadores, fase });
      }
      eliminacion[fase] = partidos;
    }
  }

  // Procesar partidos totales con ganador calculado
  const fasesOrden = ["cuartos", "semifinal", "final"];
  const partidosTotales = [];
  for (const fase of fasesOrden) {
    if (eliminacion[fase]) {
      eliminacion[fase].forEach(p => {
        const [goles1, goles2] = p.resultado.split("-").map(n => parseInt(n));
        let ganador = "";
        if (goles1 > goles2) ganador = p.equipo1;
        else if (goles2 > goles1) ganador = p.equipo2;
        else ganador = "Empate";
        partidosTotales.push({
          fase,
          nombre: `${p.equipo1} vs ${p.equipo2}`,
          resultado: p.resultado,
          ganador,
          goleadores: p.goleadores
        });
      });
    }
  }

  // Estadísticas por equipo
  const resumenEquipos = {};
  equipos.forEach(eq => {
    resumenEquipos[eq.nombre] = { jugados: 0, ganados: 0, perdidos: 0, ultimaFase: null };
  });

  partidosTotales.forEach(p => {
    const [eq1, eq2] = p.nombre.split(" vs ");
    if (resumenEquipos[eq1]) resumenEquipos[eq1].jugados++;
    if (resumenEquipos[eq2]) resumenEquipos[eq2].jugados++;

    if (p.ganador !== "Empate") {
      resumenEquipos[p.ganador].ganados++;
      const perdedor = (p.ganador === eq1) ? eq2 : eq1;
      if (resumenEquipos[perdedor]) resumenEquipos[perdedor].perdidos++;
    }

    // Actualizar última fase
    const ordenFasesIdx = { cuartos: 1, semifinal: 2, final: 3 };
    [eq1, eq2].forEach(eq => {
      if (resumenEquipos[eq]) {
        const faseActual = resumenEquipos[eq].ultimaFase;
        if (!faseActual || ordenFasesIdx[p.fase] > ordenFasesIdx[faseActual]) {
          resumenEquipos[eq].ultimaFase = p.fase;
        }
      }
    });
  });

  // Reporte de goleadores: posición, jugador, equipo, goles y minutos
  const goleadoresMap = {};
  partidosTotales.forEach(p => {
    p.goleadores.forEach(g => {
      // Buscar equipo del goleador
      let equipoGol = "";
      for (const eq of equipos) {
        if (eq.jugadores.find(j => j.nombre === g.jugador)) {
          equipoGol = eq.nombre;
          break;
        }
      }
      const clave = g.jugador + "|" + equipoGol;
      if (!goleadoresMap[clave]) {
        // Obtener posición
        let posicion = "";
        const eq = equipos.find(e => e.nombre === equipoGol);
        if (eq) {
          const jugadorObj = eq.jugadores.find(j => j.nombre === g.jugador);
          if (jugadorObj) posicion = jugadorObj.posicion;
        }
        goleadoresMap[clave] = {
          posicion,
          jugador: g.jugador,
          equipo: equipoGol,
          goles: 0,
          minutos: []
        };
      }
      goleadoresMap[clave].goles += 1;
      goleadoresMap[clave].minutos.push(g.minuto);
    });
  });

  const goleadores = Object.values(goleadoresMap).sort((a,b) => b.goles - a.goles);

  mostrarTablas(torneo, partidosTotales, resumenEquipos, goleadores);
}

function extraerValor(texto, clave) {
  const regex = new RegExp(clave + '\\s*:\\s*"([^"]+)"|'+ clave + '\\s*:\\s*(\\d+)', 'i');
  const match = texto.match(regex);
  if (match) {
    return match[1] || match[2];
  }
  return null;
}

function mostrarTablas(torneo, partidos, resumenEquipos, goleadores) {
  const contenedor = document.getElementById("reporte");
  let html = "";

  // Mostrar info del torneo
  html += `<div class="seccion">
    <h2>${torneo && torneo.nombre ? torneo.nombre : "Torneo"}</h2>
    <p><strong>Equipos:</strong> ${torneo && torneo.equipos ? torneo.equipos : "-"}</p>
    <p><strong>Sede:</strong> ${torneo && torneo.sede ? torneo.sede : "-"}</p>
  </div>`;

  // 1. Backet de eliminación
  const fasesOrden = ["cuartos", "semifinal", "final"];
  html += `<div class="seccion"><h3>🏆 Backet de Eliminación</h3>`;
  fasesOrden.forEach(fase => {
    html += `<h4>Fase: ${fase.charAt(0).toUpperCase() + fase.slice(1)}</h4>`;
    const partidosFase = partidos.filter(p => p.fase === fase);
    html += `<table border="1" cellspacing="0" cellpadding="5">
      <thead><tr><th>Partido</th><th>Resultado</th><th>Ganador</th></tr></thead><tbody>`;
    if (partidosFase.length > 0) {
      partidosFase.forEach(p => {
        html += `<tr>
          <td>${p.nombre}</td>
          <td>${p.resultado}</td>
          <td>${p.ganador}</td>
        </tr>`;
      });
    } else {
      html += `<tr><td colspan="3">No hay partidos en esta fase.</td></tr>`;
    }
    html += `</tbody></table>`;
  });
  html += `</div>`;

  // 2. Estadísticas por equipo
  html += `<div class="seccion"><h3>📊 Estadísticas por Equipo</h3>`;
  html += `<table border="1" cellspacing="0" cellpadding="5">
    <thead><tr>
      <th>Equipo</th><th>Partidos Jugados</th><th>Ganados</th><th>Perdidos</th><th>Última Fase</th>
    </tr></thead><tbody>`;
  if (resumenEquipos && Object.keys(resumenEquipos).length > 0) {
    for (const equipo in resumenEquipos) {
      const r = resumenEquipos[equipo];
      html += `<tr>
        <td>${equipo}</td>
        <td>${r.jugados}</td>
        <td>${r.ganados}</td>
        <td>${r.perdidos}</td>
        <td>${r.ultimaFase ? r.ultimaFase.charAt(0).toUpperCase() + r.ultimaFase.slice(1) : "-"}</td>
      </tr>`;
    }
  } else {
    html += `<tr><td colspan="5">No hay datos de equipos.</td></tr>`;
  }
  html += `</tbody></table></div>`;

  // 3. Reporte de goleadores
  html += `<div class="seccion"><h3>⚽ Reporte de Goleadores</h3>`;
  html += `<table border="1" cellspacing="0" cellpadding="5">
    <thead><tr>
      <th>Posición</th><th>Jugador</th><th>Equipo</th><th>Goles</th><th>Minutos</th>
    </tr></thead><tbody>`;
  if (goleadores && goleadores.length > 0) {
    goleadores.forEach(g => {
      html += `<tr>
        <td>${g.posicion}</td>
        <td>${g.jugador}</td>
        <td>${g.equipo}</td>
        <td>${g.goles}</td>
        <td>${g.minutos.join(", ")}</td>
      </tr>`;
    });
  } else {
    html += `<tr><td colspan="5">No hay datos de goleadores.</td></tr>`;
  }
  html += `</tbody></table></div>`;

  contenedor.innerHTML = html;
}

function procesarTorneo(texto) {
  const torneo = {};
  const equipos = [];

  const lineas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  let equipoActual = null;


  for (let linea of lineas) {
    if (linea.startsWith("nombre:")) {
      torneo.nombre = linea.split(":")[1].trim().replace(/"/g, "");
    } else if (linea.startsWith("equipos:")) {
      torneo.equipos = parseInt(linea.split(":")[1].trim());
    } else if (linea.startsWith("sede:")) {
      torneo.sede = linea.split(":")[1].trim().replace(/"/g, "");
    } else if (linea.startsWith("equipo:")) {
      equipoActual = {
        nombre: linea.split(":")[1].trim().replace(/"/g, ""),
        jugadores: []
      };
      equipos.push(equipoActual);
    } else if (linea.startsWith("jugador:")) {
      const partes = linea.split("[");
      const nombre = partes[0].split(":")[1].trim().replace(/"/g, "");
      const atributos = partes[1].replace("]", "").split(",").map(p => p.trim());

      const jugador = {
        nombre: nombre,
        posicion: atributos[0].split(":")[1].replace(/"/g, ""),
        numero: parseInt(atributos[1].split(":")[1]),
        edad: parseInt(atributos[2].split(":")[1])
      };

      equipoActual.jugadores.push(jugador);
    }
  }

  mostrarEnHTML(torneo, equipos);
}

function mostrarEnHTML(torneo, equipos) {
  const contenedor = document.getElementById("reporte");
  contenedor.innerHTML = "";

  // Mostrar torneo
  const torneoHTML = `
    <div class="seccion">
      <h3>🏆 Torneo</h3>
      <p><strong>Nombre:</strong> ${torneo.nombre}</p>
      <p><strong>Equipos:</strong> ${torneo.equipos}</p>
      <p><strong>Sede:</strong> ${torneo.sede}</p>
    </div>
  `;
  contenedor.innerHTML += torneoHTML;

  // Mostrar equipos
  equipos.forEach(eq => {
    let tabla = `
      <div class="seccion">
        <h3>📌 ${eq.nombre}</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Posición</th>
              <th>Número</th>
              <th>Edad</th>
            </tr>
          </thead>
          <tbody>
    `;

    eq.jugadores.forEach(j => {
      tabla += `
        <tr>
          <td>${j.nombre}</td>
          <td>${j.posicion}</td>
          <td>${j.numero}</td>
          <td>${j.edad}</td>
        </tr>
      `;
    });

    tabla += `
          </tbody>
        </table>
      </div>
    `;

    contenedor.innerHTML += tabla;
  });
}