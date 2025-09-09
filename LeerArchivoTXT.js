function leerTXT(archivo) {
      const lector = new FileReader();

      lector.onload = function(e) {
        const contenido = e.target.result;
        procesarTorneo(contenido);
      };

      lector.readAsText(archivo);
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
      const contenedor = document.getElementById("resultado");
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

    document.getElementById("txtFile").addEventListener("change", function(e) {
      const archivo = e.target.files[0];
      if (archivo) {
        leerTXT(archivo);
      } else {
        alert("No se seleccionó ningún archivo.");
      }
    });