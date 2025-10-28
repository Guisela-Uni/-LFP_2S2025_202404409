import { Error } from "../Errores/error.js";

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.errors = [];
        this.pythonCode = "";
        this.indent = "";
        this.hasSyntaxError = false;
        this.symbolTable = new Set();
    }

    peek() {
        if (this.pos >= this.tokens.length) {
        return { type: "Sintaxis", value: "Sintaxis", line: 0, column: 0 };
        }
        return this.tokens[this.pos];
    }

    match(type, value = null) {
        if (this.pos >= this.tokens.length) return false;
        const current = this.tokens[this.pos];
        if (current.type === type) {
        if (value === null || current.value === value) {
            this.pos++;
            return true;
        }
        }
        return false;
    }

    consume(type, message) {
        if (this.pos >= this.tokens.length) {
        this.reportError("Fin de archivo inesperado. " + message, 0, 0);
        return null;
        }
        const current = this.tokens[this.pos];
        if (current.type === type) {
        this.pos++;
        return current;
        } else {
        this.reportError(message, current.line, current.column);
        return null;
        }
    }

    reportError(message, line, column) {
        this.hasSyntaxError = true;
        this.errors.push(new Error("Sintáctico", "Sintaxis", message, line, column));
    }

    analizar() {
        this.validarEstructuraClase();

        if (this.hasSyntaxError) {
        return { 
            errors: this.errors, 
            python: "// Código con errores. No se puede traducir." 
        };
        }

        return { errors: this.errors, python: this.pythonCode };
    }

    validarEstructuraClase() {
        if (!this.match("PUBLIC")) {
        this.reportError("Se esperaba 'public' al inicio del código", this.peek().line, this.peek().column);
        return;
        }

        if (!this.match("CLASS")) {
        this.reportError("Se esperaba 'class' después de 'public'", this.peek().line, this.peek().column);
        return;
        }

        const nombreClase = this.consume("IDENTIFICADOR", "Se esperaba el nombre de la clase");
        if (!nombreClase) return;

        if (!this.match("SIMBOLO", "{")) {
        this.reportError("Se esperaba '{' después del nombre de la clase", this.peek().line, this.peek().column);
        return;
        }

        this.buscarMetodoPublicStaticVoid();

        if (!this.match("SIMBOLO", "}")) {
        this.reportError("Se esperaba '}' para cerrar la clase", this.peek().line, this.peek().column);
        }
    }

    buscarMetodoPublicStaticVoid() {
        let metodoEncontrado = false;
        let posicionError = { line: 0, column: 0 };

        if (this.tokens.length > this.pos) {
        posicionError = { 
            line: this.tokens[this.pos].line, 
            column: this.tokens[this.pos].column 
        };
        }

        while (this.pos < this.tokens.length && this.peek().value !== "}") {
        const token = this.peek();

        if (token.type === "PUBLIC") {
            if (this.pos + 2 < this.tokens.length) {
            const next1 = this.tokens[this.pos + 1];
            const next2 = this.tokens[this.pos + 2];

            if (next1.type === "STATIC" && next2.type === "VOID") {
                metodoEncontrado = true;
                //salta todo hasta el 1er {
                this.pos += 3; // Consume 'public', 'static', 'void'
                while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "{") {
                this.pos++;
                }
                // traduce el cuerpo
                this.traducirCuerpoMetodo();
                return;
            }
            }
            this.pos++;
        } else {
            this.reportError("Declaración no válida en la clase. Solo se permite un método 'public static void'.", token.line, token.column);
            this.pos++;
        }
        }

        if (!metodoEncontrado) {
        this.reportError("No se encontró un método 'public static void'", posicionError.line, posicionError.column);
        }
    }

    traducirCuerpoMetodo() {
        if (!this.match("SIMBOLO", "{")) {
        this.reportError("Se esperaba '{' para iniciar el cuerpo del método", this.peek().line, this.peek().column);
        return;
        }

        this.pythonCode += "# Código traducido del método\n";
        this.analizarBloque();

        if (!this.match("SIMBOLO", "}")) {
        this.reportError("Se esperaba '}' para cerrar el cuerpo del método", this.peek().line, this.peek().column);
        }
    }

    analizarBloque() {
        this.indent += "    ";
        while (this.pos < this.tokens.length && this.peek().value !== "}") {
        this.analizarSentencia();
        }
        this.indent = this.indent.slice(0, -4);
    }

    analizarSentencia() {
        const token = this.peek();

        switch (token.type) {
        case "INT_TYPE":
        case "DOUBLE_TYPE":
        case "CHAR_TYPE":
        case "STRING_TYPE":
        case "BOOLEAN_TYPE":
            this.declaracionVariable();
            break;

        case "IF":
            this.traducirIf();
            break;

        case "FOR":
            this.traducirFor();
            break;

        case "SYSTEM":
            this.traducirPrint();
            break;

        case "COMENTARIO":
            const comentarioPython = token.value.replace("//", "#");
            this.pythonCode += `${this.indent}${comentarioPython}\n`;
            this.pos++;
            break;

        case "SIMBOLO":
            if (token.value === ";") {
            this.pos++;
            } else {
            this.pos++;
            }
            break;

        default:
            if (token.type === "IDENTIFICADOR") {
            if (this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1].value === "=") {
                if (!this.symbolTable.has(token.value)) {
                this.reportError(`Variable no declarada: '${token.value}'`, token.line, token.column);
                }
                while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ";") {
                this.pos++;
                }
                if (this.pos < this.tokens.length) this.pos++;
            } else {
                this.pos++;
            }
            } else {
            this.pos++;
            }
            break;
        }
    }

    declaracionVariable() {
        const tipo = this.tokens[this.pos].type;
        this.pos++;

        const id = this.tokens[this.pos];
        if (!id || id.type !== "IDENTIFICADOR") {
        this.reportError("Se esperaba un identificador", this.tokens[this.pos]?.line || 0, this.tokens[this.pos]?.column || 0);
        this.pos++;
        return;
        }
        this.pos++;

        this.symbolTable.add(id.value);

        const igual = this.tokens[this.pos];
        if (!igual || igual.value !== "=") {
        this.reportError("Se esperaba '='", this.tokens[this.pos]?.line || 0, this.tokens[this.pos]?.column || 0);
        this.pos++;
        return;
        }
        this.pos++;

        const valor = this.tokens[this.pos];
        if (!valor) {
        this.reportError("Falta valor en asignación", id.line, id.column);
        this.pos++;
        return;
        }

        let traduccion = valor.value;
        if (tipo === "BOOLEAN_TYPE") {
        if (valor.value === "true") traduccion = "True";
        else if (valor.value === "false") traduccion = "False";
        else {
            this.reportError("Valor booleano inválido", valor.line, valor.column);
            this.pos++;
            return;
        }
        } else if (tipo === "STRING_TYPE" || tipo === "CHAR_TYPE") {
        traduccion = `"${valor.value}"`;
        }

        this.pythonCode += `${this.indent}${id.value} = ${traduccion}\n`;
        this.pos++;

        if (this.pos < this.tokens.length && this.tokens[this.pos].value === ";") {
        this.pos++;
        }
    }

    traducirIf() {
        this.pos++; // 'if'
        this.pos++; // '('

        let condicion = "";
        while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ")") {
        const tokenActual = this.tokens[this.pos];
        if (tokenActual.type === "IDENTIFICADOR" && !this.symbolTable.has(tokenActual.value)) {
            this.reportError(`Variable no declarada en condición: '${tokenActual.value}'`, tokenActual.line, tokenActual.column);
        }
        condicion += tokenActual.value + " ";
        this.pos++;
        }
        this.pos++; // ')'

        this.pythonCode += `${this.indent}if ${condicion.trim()}:\n`;
        this.pos++; // '{'

        this.analizarBloque();

        this.pos++; // '}'

        if (this.pos < this.tokens.length && this.tokens[this.pos].type === "ELSE") {
        this.pos++; // 'else'
        this.pos++; // '{'
        this.pythonCode += `${this.indent}else:\n`;

        this.analizarBloque();

        this.pos++; // '}'
        }
    }

    traducirFor() {
        this.pos++; // 'for'
        this.pos++; // '('
        this.pos++; // tipo
        const variable = this.tokens[this.pos++]; // nombre
        this.symbolTable.add(variable.value);
        this.pos++; // '='
        const inicio = this.tokens[this.pos++]; // valor
        this.pos++; // ';'
        this.pos++; // i
        this.pos++; // <
        const limite = this.tokens[this.pos++]; // n
        this.pos++; // ';'
        this.pos++; // i
        if (this.tokens[this.pos]?.value === "++") this.pos++;
        if (this.tokens[this.pos]?.value === "+") this.pos++;
        if (this.tokens[this.pos]?.value === ")") this.pos++;
        if (this.tokens[this.pos]?.value === "{") this.pos++;

        this.pythonCode += `${this.indent}for ${variable.value} in range(${inicio.value}, ${limite.value}):\n`;
        this.analizarBloque();

        if (this.tokens[this.pos]?.value === "}") this.pos++;
    }

    traducirPrint() {
        this.pos++; // System
        this.pos += 3; // saltar .out.
        this.pos++; // println
        this.pos++; // '('

        let contenido = "";
        while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ")") {
        const tok = this.tokens[this.pos];
        if (tok.type === "IDENTIFICADOR" && !this.symbolTable.has(tok.value)) {
            this.reportError(`Variable no declarada en println: '${tok.value}'`, tok.line, tok.column);
        }
        if (tok.type === "STRING") {
            contenido += `"${tok.value}" `;
        } else if (tok.type === "CHAR") {
            contenido += `'${tok.value}' `;
        } else {
            contenido += tok.value + " ";
        }
        this.pos++;
        }

        this.pos++; // ')'
        if (this.tokens[this.pos]?.value === ";") this.pos++;

        this.pythonCode += `${this.indent}print(${contenido.trim()})\n`;
    }
}