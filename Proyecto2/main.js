import { Lexer } from './Lexico/Lexer.js';
import { Parser } from './Sintaxis/parser.js';

// Despues de que el DOM se cargue por completo
document.addEventListener('DOMContentLoaded', () => {

    const javaCodeTextarea = document.getElementById('javaCode');
    const pythonCodePre = document.getElementById('pythonCode');
    const resultSection = document.getElementById('resultSection');
    const translateBtn = document.getElementById('translateBtn');
    const viewTokensBtn = document.getElementById('viewTokensBtn');
    const tokensModal = document.getElementById('tokensModal');
    const tokensReportDiv = document.getElementById('tokensReport');
    const closeTokensModal = document.getElementById('closeTokensModal');
    // Referencias para el menú "Archivo" 
    const newFileLink = document.getElementById('newFile');
    const openFileLink = document.getElementById('openFile');
    const fileInput = document.getElementById('fileInput'); 
    // para el menú "Ayuda" 
    const showHelpLink = document.getElementById('showHelp');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');
    // Función principal para traducir el código
    function traducirCodigo() {
        const codigoJava = javaCodeTextarea.value;
        tokensReportDiv.innerHTML = '';

        try {
            // primero análisis Léxico
            const lexer = new Lexer(codigoJava);
            const tokens = lexer.analizar();
            const erroresLexicos = lexer.errors;

            console.log("Tokens generados:", tokens);

            // segundo análisis Sintáctico
            const parser = new Parser(tokens);
            const resultadoParser = parser.analizar();
            const erroresSintacticos = resultadoParser.errors;
            const codigoPython = resultadoParser.python;

            console.log("Errores sintácticos encontrados:", erroresSintacticos);

            pythonCodePre.textContent = codigoPython;
            resultSection.style.display = 'block';
            generarReportes(erroresLexicos, erroresSintacticos, tokens);

        } catch (error) {
            console.error("Error en la traducción:", error);
            pythonCodePre.textContent = `// Error interno: ${error.message}`;
            resultSection.style.display = 'block';
        }
    }

    // función para generar y mostrar los reportes en el modal
    function generarReportes(erroresLexicos, erroresSintacticos, tokens) {
        let reporteHTML = '';

        // reporte de Errores Léxicos
        if (erroresLexicos.length > 0) {
            reporteHTML += '<h3> Errores Léxicos</h3>';
            reporteHTML += `
                <table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #444;">
                            <th style="padding: 8px; text-align: left;">#</th>
                            <th style="padding: 8px; text-align: left;">Error</th>
                            <th style="padding: 8px; text-align: left;">Descripción</th>
                            <th style="padding: 8px; text-align: left;">Línea</th>
                            <th style="padding: 8px; text-align: left;">Columna</th>
                        </tr>
                    </thead>
                    <tbody>`;
            erroresLexicos.forEach((error, index) => {
                reporteHTML += `
                    <tr>
                        <td style="padding: 8px;">${index + 1}</td>
                        <td style="padding: 8px;">${error.value}</td>
                        <td style="padding: 8px;">${error.message}</td>
                        <td style="padding: 8px;">${error.line}</td>
                        <td style="padding: 8px;">${error.column}</td>
                    </tr>`;
            });
            reporteHTML += '</tbody></table>';
        }

        // reporte de errores sintácticos 
        if (erroresSintacticos.length > 0) {
            reporteHTML += '<h3> Errores Sintácticos</h3>';
            reporteHTML += `
                <table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #444;">
                            <th style="padding: 8px; text-align: left;">#</th>
                            <th style="padding: 8px; text-align: left;">Error</th>
                            <th style="padding: 8px; text-align: left;">Descripción</th>
                            <th style="padding: 8px; text-align: left;">Línea</th>
                            <th style="padding: 8px; text-align: left;">Columna</th>
                        </tr>
                    </thead>
                    <tbody>`;
            erroresSintacticos.forEach((error, index) => {
                reporteHTML += `
                    <tr>
                        <td style="padding: 8px;">${index + 1}</td>
                        <td style="padding: 8px;">${error.value}</td>
                        <td style="padding: 8px;">${error.message}</td>
                        <td style="padding: 8px;">${error.line}</td>
                        <td style="padding: 8px;">${error.column}</td>
                    </tr>`;
            });
            reporteHTML += '</tbody></table>';
        }

        // reporte de Tokens 
        if (tokens.length > 0) {
            reporteHTML += '<h3>Reporte de Tokens</h3>';
            reporteHTML += `
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #444;">
                            <th style="padding: 8px; text-align: left;">#</th>
                            <th style="padding: 8px; text-align: left;">Lexema</th>
                            <th style="padding: 8px; text-align: left;">Tipo</th>
                            <th style="padding: 8px; text-align: left;">Línea</th>
                            <th style="padding: 8px; text-align: left;">Columna</th>
                        </tr>
                    </thead>
                    <tbody>`;
            tokens.forEach((token, index) => {
                reporteHTML += `
                    <tr>
                        <td style="padding: 8px;">${index + 1}</td>
                        <td style="padding: 8px;">${token.value}</td>
                        <td style="padding: 8px;">${token.type}</td>
                        <td style="padding: 8px;">${token.line}</td>
                        <td style="padding: 8px;">${token.column}</td>
                    </tr>`;
            });
            reporteHTML += '</tbody></table>';
        }

        // Si no hay nada que reportar
        if (reporteHTML === '') {
            reporteHTML = '<p>No se encontraron errores ni tokens.</p>';
        }

        tokensReportDiv.innerHTML = reporteHTML;
    }
// --- Event Listeners ---

    // --------traducción de codigo-------
    translateBtn.addEventListener('click', traducirCodigo);
    viewTokensBtn.addEventListener('click', () => {
        tokensModal.style.display = 'block';
    });
    closeTokensModal.addEventListener('click', () => {
        tokensModal.style.display = 'none';
    });

    // Cerrar el modal si se hace clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === tokensModal) {
            tokensModal.style.display = 'none';
        }
    });

    // ---- función para "Nuevo" -------
    newFileLink.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace recargue la página
        javaCodeTextarea.value = ''; // Limpia el textarea
        pythonCodePre.textContent = '# El código Python aparecerá aquí después de la traducción';
        resultSection.style.display = 'none'; 
    });

    // -------- función para "Abrir" --------
    openFileLink.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click(); // Simula un clic en el input de archivo
    });

    // maneja la selección de archivo 
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea un archivo .java
        if (file.name.endsWith('.java')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                javaCodeTextarea.value = event.target.result;
            };
            reader.readAsText(file);
        } else {
            alert('Por favor, selecciona un archivo con extensión .java');
        }

        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        fileInput.value = '';
    });

    //---------  función para Guardar código de Python -------
    savePythonBtn.addEventListener('click', () => {
        const codigoPython = pythonCodePre.textContent;

        // No permite guardar si no hay código o si es el mensaje de error
        if (!codigoPython || codigoPython.trim() === '# El código Python aparecerá aquí después de la traducción' || codigoPython.includes('// Código con errores')) {
            alert('No hay código Python válido para guardar.');
            return;
        }

        // Crear un objeto de datos (blob) 
        const blob = new Blob([codigoPython], { type: 'text/plain' });

        // Crear un enlace temporal para la descarga
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codigo_traducido.py'; 

        // clic en el enlace y limpiar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Liberar la memoria
    });

    // ------- función para "Mostrar ayuda" --------
    showHelpLink.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace recargue la página
        helpModal.style.display = 'block';
    });

    // función para cerrar el modal de ayuda
    closeHelpModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    //Cerrar el modal de ayuda si se hace clic fuera de él 
    window.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
});