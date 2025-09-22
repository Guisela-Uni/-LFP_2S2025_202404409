// Función para extraer pares atributo-valor desde la lista de tokens
export function extraerAtributos(tokens) {
    const atributos = {};
    for (let i = 0; i < tokens.length - 1; i++) {
        const actual = tokens[i];
        const siguiente = tokens[i + 1];

        if (actual.tipo === "ATRIBUTO" && 
            (siguiente.tipo === "CADENA" || siguiente.tipo === "NUMERO")) {
            atributos[actual.lexema] = siguiente.lexema;
        }
    }
    return atributos;
}

// Función para generar el código DOT de Graphviz con los atributos extraídos
export function generarDot(atributos) {
    const nombre = atributos["nombre"] || "Nombre no encontrado";
    const sede = atributos["sede"] || "Sede no encontrada";

    return `
digraph Torneo {
    graph [labelloc="t", fontsize=20];
    node [shape=box, style=filled, color="#f0f0f0", fontname="Arial"];

    Torneo [label="Nombre: ${nombre}"];
    Sede [label="Sede: ${sede}"];
    Torneo -> Sede [label="se juega en", color="#0077cc"];
}
`;
}