import { token, palabrasReservadas, AtributosValidos, Simbolos } from './token.js';

export class Lexico {
    constructor(texto) {
        this.texto = texto;
        this.position = 0;
        this.linea = 1;
        this.columna = 1;
        this.estado = "INICIO";
        //this.currentChar = this.texto[this.position];
        this.tokens = [];
        this.errores = [];
    }

    analizar() {
        while (this.position < this.texto.length) { //analliza caracter por caracter
            let char = this.texto[this.position];
            
            //Estado AFD=inicio
            if(this.estado === "INICIO"){
                //ignorar espacios y saltos de linea
                if (char === ' ' || char === '\t') {
                    this.avanzar();
                    continue; //siguiente caracter
                }
                //salto de linea
                if (char === '\n') {
                    this.linea++;
                    this.columna = 1;
                    this.position++;
                    continue; 
                }
                //verificar si es cadena de texto
                if (this.esLetra(char)) {
                    this.estado="IDENTIFICADOR" //cambia el estado
                    this.buffer = ""; //inicia buffer, que permite almacenar caracteres
                    this.inicioColumna = this.columna; //guarda la columna de inicio del token
                    continue;
                }
                
                if (this.esDigito(char)) {
                    this.estado="NUMERO"
                    this.buffer = "";
                    this.inicioColumna = this.columna;
                    continue;
                }

                if (char === '"') {
                    this.estado="CADENA"
                    this.buffer = "";
                    this.inicioColumna = this.columna;
                    this.avanzar();
                    continue;
                }

                //verificar si viene un simbolo
                if (Object.keys(Simbolos).includes(char)) {
                    //crea token y lo agrega a la lista con su tipo y lexema
                    this.tokens.push(new token(Simbolos[char], char, this.linea, this.columna)); 
                    this.avanzar();
                    continue;
                }

                this.agregarError(char, "Caracter no reconocido", "Token invalido");
                this.avanzar();
            } else if (this.estado === "IDENTIFICADOR") {
                if (this.esLetra(this.texto[this.position])) {
                    this.buffer += this.texto[this.position]; //agrega al buffer
                    this.avanzar(); //almacene mi letra
                } else{
                    this.agregarTokenIdentificador(this.buffer, this.inicioColumna);
                    this.estado = "INICIO"; //vuelve al estado inicial
                }
            } else if (this.estado === "NUMERO") {
                if (this.esDigito(this.texto[this.position])) { 
                    this.buffer += this.texto[this.position]; //agrega al buffer
                    this.avanzar(); //almacene mi letra
                } else{
                    //manda a crear token error
                    this.tokens.push(new token("NUMERO", this.buffer, this.linea, this.inicioColumna));
                    this.estado = "INICIO"; //vuelve al estado inicial
                }
            } else if (this.estado === "CADENA") {
                if (this.texto[this.position] === '"') {
                    //crea token cadena (tipo, lexema, linea, columna)
                    this.tokens.push(new token("CADENA", this.buffer, this.linea, this.inicioColumna));
                    this.avanzar(); //avanza para no volver a leer la comilla de cierre
                    this.estado = "INICIO"; //vuelve al estado inicial
                } else if (this.position >= this.texto.length) {
                    this.agregarError(this.buffer, "Cadena no cerrada", "Token invalido");
                    this.estado = "INICIO"; //vuelve al estado inicial
                } else {
                    this.buffer += this.texto[this.position]; //agrega al buffer
                    this.avanzar(); //almacene mi letra
                }
            }

        }

        //retorna los tokens y errores encontrados
        return { tokens: this.tokens, errores: this.errores };
    }

    agregarError(lexema, descripcion, tipo, columna = this.inicioColumna) {
        this.errores.push({ lexema, descripcion, tipo, linea: this.linea, columna });
    }

    //metodo para agregar token identificador
    agregarTokenIdentificador(lexema, inicioColumna) {
        if (palabrasReservadas.includes(lexema)) { //si es palabra reservada, es un token de ese tipo
            this.tokens.push(new token("PALABRA_RESERVADA", lexema, this.linea, inicioColumna));
        } else if (AtributosValidos.includes(lexema)) {
            this.tokens.push(new token("ATRIBUTO", lexema, this.linea, inicioColumna));
        } else {
            this.agregarError(lexema, "Token invalido", "Identificador no permitido", inicioColumna);
        }
    }    

    //metodo para verificar si es letra
    esLetra(c) {
        return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c == "_";
    }

    //metodo para verificar si es digito
    esDigito(c) {
        return c >= '0' && c <= '9';
    }

    //metodo para avanzar
    avanzar() {
        if (this.position < this.texto.length) {
            if (this.texto[this.position] === '\n') {
                this.linea++;
                this.columna = 1;
            } else {
                this.columna++;
            }
            this.position++;
        }
    }
}