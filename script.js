document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvasJuego');
    const ctx = canvas.getContext('2d');
    const botonIniciar = document.getElementById('botonIniciar');
    const pantallaInicio = document.getElementById('pantalla-inicio');
    const textoPuntos = document.getElementById('puntos');
    const textoRecord = document.getElementById('record');

    // Detectar botones táctiles
    const btnArriba = document.getElementById('btnArriba');
    const btnAbajo = document.getElementById('btnAbajo');
    const btnIzquierda = document.getElementById('btnIzquierda');
    const btnDerecha = document.getElementById('btnDerecha');

    const tamanoCuadrito = 20;
    let serpiente = [];
    let premio = { x: 0, y: 0, tipo: 'manzana' }; 
    let dx = tamanoCuadrito; 
    let dy = 0;             
    let puntos = 0;
    let record = localStorage.getItem('recordMaximo') || 0; 
    let juegoIntervalo;
    let colorCabeza = '#2ecc71'; 

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function reproducirSonido(tipo) {
        const oscilador = audioCtx.createOscillator();
        const ganancia = audioCtx.createGain();
        oscilador.connect(ganancia);
        ganancia.connect(audioCtx.destination);

        if (tipo === 'comer') {
            oscilador.type = 'sine';
            oscilador.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
            oscilador.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); 
            ganancia.gain.setValueAtTime(0.1, audioCtx.currentTime);
            ganancia.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            oscilador.start();
            oscilador.stop(audioCtx.currentTime + 0.12);
        } else if (tipo === 'perder') {
            oscilador.type = 'sawtooth';
            oscilador.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscilador.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.4); 
            ganancia.gain.setValueAtTime(0.2, audioCtx.currentTime);
            ganancia.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            oscilador.start();
            oscilador.stop(audioCtx.currentTime + 0.4);
        }
    }

    textoRecord.innerText = record;

    // Escuchas para teclado y para clics táctiles
    document.addEventListener('keydown', cambiarDireccionTeclado);
    botonIniciar.addEventListener('click', iniciarJuego);

    btnArriba.addEventListener('click', () => cambiarDireccion('Arriba'));
    btnAbajo.addEventListener('click', () => cambiarDireccion('Abajo'));
    btnIzquierda.addEventListener('click', () => cambiarDireccion('Izquierda'));
    btnDerecha.addEventListener('click', () => cambiarDireccion('Derecha'));

    function iniciarJuego() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        pantallaInicio.style.display = 'none';
        serpiente = [
            { x: 160, y: 200 },
            { x: 140, y: 200 },
            { x: 120, y: 200 }
        ];
        dx = tamanoCuadrito;
        dy = 0;
        puntos = 0;
        colorCabeza = '#2ecc71';
        textoPuntos.innerText = puntos;
        colocarPremio();
        
        if (juegoIntervalo) clearInterval(juegoIntervalo);
        juegoIntervalo = setInterval(bucleJuego, 180); 
    }

    function bucleJuego() {
        if (comprobarChoque()) {
            clearInterval(juegoIntervalo);
            reproducirSonido('perder');
            if (puntos > record) {
                record = puntos;
                localStorage.setItem('recordMaximo', record); 
                textoRecord.innerText = record;
            }
            pantallaInicio.style.display = 'flex';
            botonIniciar.innerText = 'Reintentar';
            return;
        }

        limpiarTablero();
        dibujarPremio();
        moverSerpiente();
        dibujarSerpiente();
    }

    function limpiarTablero() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function dibujarSerpiente() {
        serpiente.forEach((parte, index) => {
            ctx.fillStyle = index === 0 ? colorCabeza : '#27ae60'; 
            ctx.fillRect(parte.x, parte.y, tamanoCuadrito - 2, tamanoCuadrito - 2);
        });
    }

    function moverSerpiente() {
        const cabeza = { x: serpiente[0].x + dx, y: serpiente[0].y + dy };
        serpiente.unshift(cabeza);

        if (cabeza.x === premio.x && cabeza.y === premio.y) {
            reproducirSonido('comer');
            if (premio.tipo === 'cereza') {
                puntos += 50; 
                colorCabeza = '#00ced1'; 
            } else if (premio.tipo === 'estrella') {
                puntos += 30; 
                colorCabeza = '#f1c40f'; 
            } else {
                puntos += 10; 
                colorCabeza = '#2ecc71'; 
            }
            textoPuntos.innerText = puntos;
            colocarPremio();
        } else {
            serpiente.pop(); 
        }
    }

    // Lógica unificada para cambiar de rumbo
    function cambiarDireccion(dir) {
        const yendoArriba = dy === -tamanoCuadrito;
        const yendoAbajo = dy === tamanoCuadrito;
        const yendoDerecha = dx === tamanoCuadrito;
        const yendoIzquierda = dx === -tamanoCuadrito;

        if (dir === 'Izquierda' && !yendoDerecha) { dx = -tamanoCuadrito; dy = 0; }
        if (dir === 'Arriba' && !yendoAbajo) { dx = 0; dy = -tamanoCuadrito; }
        if (dir === 'Derecha' && !yendoIzquierda) { dx = tamanoCuadrito; dy = 0; }
        if (dir === 'Abajo' && !yendoArriba) { dx = 0; dy = tamanoCuadrito; }
    }

    function cambiarDireccionTeclado(evento) {
        const tecla = evento.key;
        if (tecla === 'ArrowLeft') cambiarDirection('Izquierda');
        if (tecla === 'ArrowUp') cambiarDireccion('Arriba');
        if (tecla === 'ArrowRight') cambiarDireccion('Derecha');
        if (tecla === 'ArrowDown') cambiarDireccion('Abajo');
    }

    function colocarPremio() {
        premio.x = Math.floor(Math.random() * (canvas.width / tamanoCuadrito)) * tamanoCuadrito;
        premio.y = Math.floor(Math.random() * (canvas.height / tamanoCuadrito)) * tamanoCuadrito;
        
        let suerte = Math.random();
        if (suerte < 0.05) {
            premio.tipo = 'cereza';    
        } else if (suerte < 0.25) {
            premio.tipo = 'estrella';  
        } else {
            premio.tipo = 'manzana';   
        }
    }

    function dibujarPremio() {
        if (premio.tipo === 'cereza') ctx.fillStyle = '#00ced1'; 
        else if (premio.tipo === 'estrella') ctx.fillStyle = '#f1c40f'; 
        else ctx.fillStyle = '#e74c3c'; 
        ctx.fillRect(premio.x, premio.y, tamanoCuadrito - 2, tamanoCuadrito - 2);
    }

    function comprobarChoque() {
        const cabeza = serpiente[0];
        if (cabeza.x < 0 || cabeza.x >= canvas.width || cabeza.y < 0 || cabeza.y >= canvas.height) return true;
        for (let i = 1; i < serpiente.length; i++) {
            if (cabeza.x === serpiente[i].x && cabeza.y === serpiente[i].y) return true;
        }
        return false;
    }
});