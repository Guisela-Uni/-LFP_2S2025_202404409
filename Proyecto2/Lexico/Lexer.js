import { Token, ReservedWords } from "../Token/token.js";
import { Error } from "../Errores/error.js";

export class Lexer {
    // constructor
    constructor(texto) {
        this.texto = texto;
        this.pos = 0;
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
        this.errors = [];
        this.recorrido = [];
    }

    avanzar() {
        this.pos++;
        this.columna++;
    }

    analizar() {
        while (this.pos < this.texto.length) {
            let char = this.texto[this.pos];

            // ignora saltos de linea
            if (char === " " || char === "\t") { this.avanzar(); continue; }
            if (char === "\n") { this.linea++; this.columna = 1; this.avanzar(); continue; }

            // inicializado en 0
            if (char === "/") {
                // verificar si es un comentario de una línea '//'
                if (this.pos + 1 < this.texto.length && this.texto[this.pos + 1] === "/") {
                    this.recorrerComentario();
                    continue;
                }
            }

            if (this.esLetra(char)) {
                this.recorrerIdentificador();
                continue;
            }

            if (this.esDigito(char)) {
                this.recorrerNumero();
                continue;
            }

            if (char === '"') {
                this.recorrerCadena();
                continue;
            }

            if (char === "'") {
                this.recorrerCaracter();
                continue;
            }

            if (this.esSimbolo(char)) {
                this.recorrerSimbolo();
                continue;
            }

            this.errors.push(new Error("Léxico", char, "Carácter no reconocido", this.linea, this.columna));
            this.avanzar();
        }

        return this.tokens;
    }

    recorrerIdentificador() {
        let inicioCol = this.columna;
        let buffer = "";
    
        while (
            this.pos < this.texto.length &&
            (this.esLetra(this.texto[this.pos]) || this.esDigito(this.texto[this.pos]))
        ) {
            buffer += this.texto[this.pos];
            this.recorrido.push({
                estado: "ID",
                char: this.texto[this.pos],
                next: "ID"
            });
            this.avanzar();
        }

        // verificar si es palabra reservada
        let esReservada = false;
        let tipoReservada = "";

        for (let palabra in ReservedWords) {
            if (palabra.toLowerCase() === buffer.toLowerCase()) {
                esReservada = true;
                tipoReservada = ReservedWords[palabra];
                break; 
            }
        }

        if (esReservada) {
            this.tokens.push(new Token(tipoReservada, buffer, this.linea, inicioCol));
        } else {
            this.tokens.push(new Token("IDENTIFICADOR", buffer, this.linea, inicioCol));
        }
    }
    
    // Si es un numero, lo recorremos, para validar que no haya decimales como 1.24.36
    recorrerNumero() {
        let inicioCol = this.columna;
        let buffer = "";
        let puntosDecimales = 0; // cuenta puntos
        let posPunto = -1; // posicion del 1er punto

        while (this.pos < this.texto.length) {
            const char = this.texto[this.pos];

            // Si es un dígito, se agrega al buffer
            if (this.esDigito(char)) {
                buffer += char;
                this.recorrido.push({ estado: "NUM", char: char, next: "NUM" });
                this.avanzar();
            }
            // Si es un punto decimal
            else if (char === ".") {
                puntosDecimales++;
                if (puntosDecimales === 1) {
                    // 1er punto permitido
                    buffer += char;
                    posPunto = buffer.length - 1; // se guarda la pos, en el buffer
                    this.recorrido.push({ estado: "NUM", char: char, next: "NUM" });
                    this.avanzar();
                } else {
                    // se reporta el 2do punto
                    this.errors.push(new Error(
                        "Léxico", 
                        buffer + char, //muestra numero hasta otro punto
                        "Número decimal inválido", 
                        this.linea, 
                        this.columna
                    ));
                    this.avanzar(); // se avanza para salir del bucle
                    return;
                }
            }
            // Si no es ni dígito ni punto, se deja de leer el numero
            else {
                break;
            }
        }

        // validar no teerminar con punto para un numero 12.
        if (puntosDecimales > 0 && buffer[buffer.length - 1] === ".") {
            this.errors.push(new Error(
                "Léxico", 
                buffer, 
                "Número decimal inválido", 
                this.linea, 
                inicioCol
            ));
            return;
        }

        // validacion para puntos decimales
        if (buffer[0] === ".") {
            this.errors.push(new Error(
                "Léxico", 
                buffer, 
                "Número decimal inválido", 
                this.linea, 
                inicioCol
            ));
            return;
        }

        // aqui determina que el numero es valido
        const tipoToken = (puntosDecimales === 1) ? "DOUBLE" : "INT";
        this.tokens.push(new Token(tipoToken, buffer, this.linea, inicioCol));
    }

    recorrerCadena() {
        let inicioCol = this.columna;
        let buffer = "";
        this.avanzar(); 
        while (this.pos < this.texto.length && this.texto[this.pos] !== '"') {
            buffer += this.texto[this.pos];
            this.avanzar();
        }
        if (this.pos >= this.texto.length) {
            this.errors.push(new Error("Léxico", buffer, "Cadena sin cerrar", this.linea, inicioCol));
            return;
        }
        this.avanzar();
        this.tokens.push(new Token("STRING", buffer, this.linea, inicioCol));
    }

    recorrerCaracter() {
        let inicioCol = this.columna;
        let buffer = "";
        this.avanzar();
        if (this.pos < this.texto.length) {
            buffer = this.texto[this.pos];
            this.avanzar();
        }
        if (this.texto[this.pos] !== "'") {
            this.errors.push(new Error("Léxico", buffer, "Carácter mal formado", this.linea, inicioCol));
            return;
        }
        this.avanzar();
        this.tokens.push(new Token("CHAR", buffer, this.linea, inicioCol));
    }

    recorrerSimbolo() {
        let inicioCol = this.columna;
        let char = this.texto[this.pos];
        let next = this.texto[this.pos + 1] || "";

        if ((char === "=" && next === "=") || (char === "!" && next === "=") ||
            (char === ">" && next === "=") || (char === "<" && next === "=") ||
            (char === "+" && next === "+") || (char === "-" && next === "-")) {
            this.tokens.push(new Token("OPERADOR", char + next, this.linea, inicioCol));
            this.avanzar();
            return;
        }

        // verificar de operadores
        if (char === "=" || char === "+" || char === "-" || 
            char === "*" || char === "/" || char === "%" || 
            char === ">" || char === "<" || char === "!") {
            this.tokens.push(new Token("OPERADOR", char, this.linea, inicioCol));
            this.avanzar();
            return;
        }
        this.tokens.push(new Token("SIMBOLO", char, this.linea, inicioCol));
        this.avanzar();
    }

    esSimbolo(c) {
        switch (c) {
            case '{': case '}':
            case '(': case ')':
            case '[': case ']':
            case ';': case ',':
            case '.': case ':':
            case '=': case '+':
            case '-': case '*':
            case '/': case '%':
            case '^': case '&':
            case '|': case '!':
            case '>': case '<':
                return true;
            default:
                return false;
        }
    }

    esLetra(c) { return (c >= "A" && c <= "Z") || (c >= "a" && c <= "z"); }
    esDigito(c) { return (c >= "0" && c <= "9"); }

    // recorrer comentario
    recorrerComentario() {
        let inicioCol = this.columna;
        let buffer = "//";

        // para traducir comentario '//'
        this.avanzar(); // Salta el primer '/'
        this.avanzar(); // Salta el segundo '/'

        //lee hasta el final de la linea
        while (this.pos < this.texto.length && this.texto[this.pos] !== "\n") {
            buffer += this.texto[this.pos];
            this.avanzar();
        }

        // agrega el token de comentario
        this.tokens.push(new Token("COMENTARIO", buffer, this.linea, inicioCol));
    }
}