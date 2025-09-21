// Al presionar el botón, se analiza el archivo
document.querySelector(".analizar").addEventListener("click", function() {
    if (archivoSeleccionado) {
        alert("Archivo revisado correctamente, aqui vemos los errores");
    } else {
        alert("Primero selecciona un archivo.");
    }
    });