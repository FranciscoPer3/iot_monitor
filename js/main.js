class CarMonitor {
    constructor() {
        this.ws = null;
        this.deviceId = 1;
        this.isConnected = false;
        this.movementCount = 0;
        
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.startPeriodicUpdates();
        this.createConnectionStatus();
    }

    connectWebSocket() {
        // ✅ URL ACTUALIZADA CON SERVEO
        const serverUrl = 'wss://fickly-exorcismal-glen.ngrok-free.dev';
        
        console.log('Conectando monitor a:', serverUrl);
        this.ws = new WebSocket(serverUrl);
        
        this.ws.onopen = () => {
            console.log('✅ Monitor conectado al servidor WebSocket');
            this.isConnected = true;
            this.updateConnectionStatus();
            this.requestInitialData();
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('🔴 Conexión monitor cerrada');
            this.isConnected = false;
            this.updateConnectionStatus();
            setTimeout(() => this.connectWebSocket(), 5000);
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ Error WebSocket monitor:', error);
            this.isConnected = false;
            this.updateConnectionStatus();
        };
    }

    createConnectionStatus() {
        const statusElement = document.createElement('div');
        statusElement.id = 'connectionStatus';
        statusElement.textContent = '🟢 CONECTADO';
        statusElement.className = 'status-connected';
        document.body.appendChild(statusElement);
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = this.isConnected ? 
                '🟢 CONECTADO - Monitoreo en tiempo real' : 
                '🔴 DESCONECTADO - Reconectando...';
            statusElement.className = this.isConnected ? 'status-connected' : 'status-disconnected';
        }
    }

    requestInitialData() {
        if (!this.isConnected) return;

        // Solicitar últimos movimientos
        this.ws.send(JSON.stringify({
            type: 'monitoring',
            action: 'get_last_10_movements',
            deviceId: this.deviceId
        }));
    }

    handleMessage(data) {
        console.log('Datos recibidos en monitor:', data);
        
        switch (data.type) {
            case 'monitoring_data':
                this.updateMonitoringData(data);
                break;
            case 'movement_update':
                this.addRealTimeMovement(data);
                break;
            case 'obstacle_detected':
                this.showObstacleAlert(data);
                break;
            case 'connection':
                this.updateConnectionStatus();
                break;
            case 'pong':
                // Respuesta de ping, no hacer nada
                break;
        }
    }

    updateMonitoringData(data) {
        if (data.action === 'get_last_10_movements') {
            this.updateMovementsTable(data.data);
            this.updateStats(data.data);
        }
    }

    updateMovementsTable(movements) {
        const tbody = document.querySelector('#deviceTable tbody');
        
        if (!movements || movements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay movimientos registrados</td></tr>';
            return;
        }

        // INVERTIR el orden para que el más reciente esté primero
        const reversedMovements = [...movements].reverse();

        tbody.innerHTML = reversedMovements.map((movement, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${movement.status_texto || this.getActionNameFromText(movement.status_texto)}</td>
                <td><span class="status-badge completed">Completado</span></td>
                <td>${new Date(movement.fecha_hora).toLocaleString()}</td>
                <td>Dispositivo ${this.deviceId}</td>
            </tr>
        `).join('');
        
        this.movementCount = movements.length;
        this.updateStats(movements);
    }

    // FUNCIÓN ACTUALIZADA CON LOS NOMBRES CORRECTOS DE TU BD
    getActionNameFromText(statusText) {
        const actionMap = {
            'Adelante': '🔼 ADELANTE',
            'Atrás': '🔽 ATRÁS', 
            'Detener': '⏹️ DETENER',
            'Vuelta adelante derecha': '↪️ VUELTA ADELANTE DER',
            'Vuelta adelante izquierda': '↩️ VUELTA ADELANTE IZQ',
            'Vuelta atrás derecha': '↘️ VUELTA ATRÁS DER',
            'Vuelta atrás izquierda': '↙️ VUELTA ATRÁS IZQ',
            'Giro 90° derecha': '➡️ GIRO 90° DER',
            'Giro 90° izquierda': '⬅️ GIRO 90° IZQ',
            'Giro 360° derecha': '🔁 GIRO 360° DER',
            'Giro 360° izquierda': '🔄 GIRO 360° IZQ',
            'Subir Velocidad': '⚡ SUBIR VELOCIDAD',
            'Bajar Velocidad': '🐢 BAJAR VELOCIDAD'
        };
        
        return actionMap[statusText] || statusText;
    }

    // FUNCIÓN ACTUALIZADA CON LOS IDs CORRECTOS DE TU BD
    getActionName(operationId) {
        const actions = {
            1: '🔼 ADELANTE',
            2: '🔽 ATRÁS', 
            3: '⏹️ DETENER',
            4: '↪️ VUELTA ADELANTE DER',
            5: '↩️ VUELTA ADELANTE IZQ',
            6: '↘️ VUELTA ATRÁS DER',
            7: '↙️ VUELTA ATRÁS IZQ',
            8: '➡️ GIRO 90° DER',
            9: '⬅️ GIRO 90° IZQ',
            10: '🔁 GIRO 360° DER',
            11: '🔄 GIRO 360° IZQ',
            12: '⚡ SUBIR VELOCIDAD',
            13: '🐢 BAJAR VELOCIDAD',
            14: '💾 GUARDAR MOVIMIENTO',
            15: '▶️ REPLICAR MOVIMIENTO'
        };
        
        return actions[operationId] || `Operación ${operationId}`;
    }

    // FUNCIÓN AUXILIAR PARA TEXTO DESCRIPTIVO
    getActionTextFromId(operationId) {
        const actionTexts = {
            1: 'Adelante',
            2: 'Atrás',
            3: 'Detener',
            4: 'Vuelta adelante derecha',
            5: 'Vuelta adelante izquierda',
            6: 'Vuelta atrás derecha',
            7: 'Vuelta atrás izquierda',
            8: 'Giro 90° derecha',
            9: 'Giro 90° izquierda',
            10: 'Giro 360° derecha',
            11: 'Giro 360° izquierda',
            12: 'Subir Velocidad',
            13: 'Bajar Velocidad',
            14: 'Guardar Movimiento',
            15: 'Replicar Movimiento'
        };
        
        return actionTexts[operationId] || `Operación ${operationId}`;
    }

    addRealTimeMovement(data) {
        const tbody = document.querySelector('#deviceTable tbody');
        
        // Si está vacío o muestra "no hay datos", limpiar
        if (tbody.innerHTML.includes('No hay movimientos') || tbody.innerHTML.includes('Conectando')) {
            tbody.innerHTML = '';
        }

        // Obtener el texto descriptivo completo con emojis
        const actionText = this.getActionNameFromText(this.getActionTextFromId(data.operationId));
        
        // Agregar nueva fila al inicio
        const newRow = `
            <tr class="new-movement">
                <td>Nuevo</td>
                <td>${actionText}</td>
                <td><span class="status-badge active">En ejecución</span></td>
                <td>${new Date(data.timestamp).toLocaleString()}</td>
                <td>Dispositivo ${data.deviceId}</td>
            </tr>
        `;
        
        tbody.innerHTML = newRow + tbody.innerHTML;
        
        // Limitar a 15 filas máximo
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 15) {
            rows[rows.length - 1].remove();
        }
        
        this.movementCount++;
        this.updateStats();
        
        // Remover clase de highlight después de 3 segundos
        setTimeout(() => {
            const newMovementRow = document.querySelector('.new-movement');
            if (newMovementRow) {
                newMovementRow.classList.remove('new-movement');
                // Actualizar estado a completado
                const statusBadge = newMovementRow.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Completado';
                    statusBadge.className = 'status-badge completed';
                }
            }
        }, 3000);
    }

    showObstacleAlert(data) {
        // Eliminar alertas existentes
        document.querySelectorAll('.obstacle-alert').forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = 'obstacle-alert';
        alert.innerHTML = `
            <div class="alert-content">
                <strong>🚨 OBSTÁCULO DETECTADO</strong>
                <p>Dispositivo: ${data.deviceId}</p>
                <p>Hora: ${new Date(data.timestamp).toLocaleTimeString()}</p>
                <button class="alert-close">×</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Configurar evento de cierre
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    updateStats(movements = null) {
        // Actualizar contador de movimientos activos
        const activeMovementsElement = document.getElementById('activeMovements');
        if (activeMovementsElement) {
            const activeCount = document.querySelectorAll('.status-badge.active').length;
            activeMovementsElement.textContent = activeCount;
        }

        // Actualizar estado del sistema
        const systemStatusElement = document.getElementById('systemStatus');
        if (systemStatusElement) {
            systemStatusElement.textContent = this.isConnected ? '🟢 EN LÍNEA' : '🔴 OFFLINE';
            systemStatusElement.className = this.isConnected ? 'status-online' : 'status-offline';
        }

        // Actualizar estado de la base de datos
        const dbStatusElement = document.getElementById('dbStatus');
        if (dbStatusElement) {
            dbStatusElement.textContent = this.isConnected ? '🟢 IoTDB CONECTADA' : '🔴 BD NO CONECTADA';
            dbStatusElement.className = this.isConnected ? 'status-online' : 'status-offline';
        }
    }

    startPeriodicUpdates() {
        // Actualizar datos cada 10 segundos
        setInterval(() => {
            if (this.isConnected) {
                this.requestInitialData();
            }
        }, 10000);
        
        // Enviar ping cada 30 segundos para mantener conexión
        setInterval(() => {
            if (this.isConnected && this.ws) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }
}

// Inicializar monitor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CarMonitor();
});