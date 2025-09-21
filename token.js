export class token{
    constructor(tipo, lexema, linea, columna){
        this.tipo = tipo;
        this.lexema = lexema;
        this.linea = linea;
        this.columna = columna;
    }
}
//creacion de diccionario para palabras reservadas-> palabras reservadas diferentes a atributos
export const palabrasReservadas = [
    "TORNEO",
    "EQUIPOS",
    "ELIMINACION",
    "equipo",
    "jugador",
    "partido",
    "resultado",
    "goleador"
];
//diccionario de atributos validos
export const AtributosValidos = [
    "nombre",
    "sede",
    "posicion",
    "equipos",
    "edad",
    "numero",
    "cuartos",
    "semifinal",
    "final",
    "vs",
    "goleadores",
    "minuto"
];

//diccionario de simbolos
export const Simbolos = {
    "{" : "Lave Izquierda",
    "}" : "Llave Derecha",
    "[" : "Corchete Izquierdo",
    "]" : "Corchete Derecho",
    "(" : "Parentesis Izquierdo",
    ")" : "Parentesis Derecho",
    ":" : "Dos Puntos",
    ";" : "Punto y Coma",
    "," : "Coma",
    "." : "Punto"
}