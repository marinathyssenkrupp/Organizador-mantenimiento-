
import { GoogleGenAI, Schema } from "@google/genai";
import { MaintenanceRecord, Location, EquipmentType, Shift } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Master Inventory List for Gap Analysis
// Updated with specific sub-sectors for elevators AND escalators
const MASTER_INVENTORY = {
  [Location.MOL_MAL_MARINO]: [
    // Elevators
    "Ripley", "París", "Torre Marina", "Ascensor Panorámico", "Cine", "Montacargas 14 Norte", "Montacargas 15 Norte",
    // Escalators/Other
    "Gimnasio", "Sector Patio Comida", "Sector Cruz Verde"
  ],
  [Location.MARINA_BOULEVARD]: [
    // Elevators
    "Torre Boulevard", "Estacionamientos Otis", "Pasarela Boulevard", "Montacarga Boulevard",
    // Escalators/Other
    "Primer Piso", "Segundo Piso", "Tercer Piso", "Pasarelas"
  ],
  [Location.AMA]: [
    // Elevators
    "Torre AMA", "Ascensores H&M", "Estacionamientos Torre Ama", "Ascensores Jumbo", "Montacargas de AMA",
    // Escalators/Other
    "Rampas", "Escaleras Mecánicas", "Sector Jumbo"
  ]
};

// --- Analysis Logic ---
export const analyzeMaintenanceData = async (
  records: MaintenanceRecord[],
  monthLabel: string,
  location: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key no encontrada.";

  // Simplify data for token efficiency
  const dataSummary = records.map(r => ({
    dia: r.date,
    hora: r.time,
    tec: r.technician,
    sector: r.sector,
    tipo: r.equipmentType,
    id_equipo: r.equipmentOrder
  }));

  const prompt = `
    Analiza la siguiente lista de mantenciones realizadas en ${location} durante ${monthLabel}.
    Responde en formato Markdown, sé breve y profesional.
    
    Tus objetivos:
    1. Resumir la cantidad total de mantenciones por tipo (Ascensor vs Escalera).
    2. Identificar si hay algún técnico que haya realizado la mayoría de los trabajos.
    3. Detectar si algún día específico hubo una carga de trabajo inusualmente alta.
    4. Dar una conclusión breve sobre el estado del mantenimiento este mes.

    Datos (JSON):
    ${JSON.stringify(dataSummary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al analizar los datos con Gemini.";
  }
};

// --- Visual Inventory Analysis ---

export const analyzeEquipmentImage = async (
    imageBase64: string, 
    currentRecords: MaintenanceRecord[]
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "Error: API Key no encontrada.";

    // Simplify records to just a list of equipment names that have been maintained
    const maintainedEquipment = currentRecords.map(r => 
        `${r.equipmentOrder} (${r.location} - ${r.sector || 'General'}) - ${r.date}`
    );

    // Clean base64 header
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const prompt = `
    Actúa como un Supervisor de Mantenimiento experto.
    
    Te estoy enviando una imagen que puede ser:
    1. Una lista o planilla física de equipos.
    2. Un plano del Mall (Marina, Boulevard o Ama).
    3. Una foto de un sector con ascensores/escaleras.

    Tu tarea es:
    1. **Identificar** todos los equipos (ascensores/escaleras) que aparecen o se listan en la imagen.
    2. **Comparar** esa lista visual con los registros de mantenimiento YA REALIZADOS este mes (lista provista abajo).
    3. **Generar un reporte** que diga:
       - Qué equipos de la imagen YA tienen mantención (Status: OK ✅).
       - Qué equipos de la imagen FALTAN por mantener (Status: PENDIENTE ⚠️).
    
    Lista de Mantenciones Realizadas (JSON):
    ${JSON.stringify(maintainedEquipment)}

    Formato de respuesta sugerido (Markdown):
    - Resumen General
    - Lista comparativa
    - Alerta de equipos críticos faltantes (si los hay en la imagen).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No se pudo analizar la imagen.";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "Hubo un error al procesar la imagen. Asegúrate de que sea clara.";
    }
};

// --- Shift Schedule Analysis ---

export const analyzeShiftSchedule = async (
    fileBase64: string,
    mimeType: string
): Promise<Shift[]> => {
    const ai = getAIClient();
    if (!ai) return [];

    const cleanBase64 = fileBase64.split(',')[1] || fileBase64;

    const prompt = `
    Analiza esta imagen o documento que contiene una planilla de turnos (work schedule).
    
    Objetivo: Extraer Supervisores y Técnicos asignados por fecha, distinguiendo si es turno de DÍA o de NOCHE.
    
    Instrucciones Avanzadas:
    1. Busca fechas (convertir a YYYY-MM-DD).
    2. Busca nombres de personas.
    3. **Roles**: Si dice "Supervisor", "Sup", "Encargado", asígnalo como 'Supervisor'. Si no, 'Técnico'.
    4. **Horario**: 
       - Si la planilla tiene columnas o secciones que dicen "Noche", "Night", "22:00", "Turno B", marca 'shiftType' como 'Noche'.
       - Si es horario normal, "Día", "Mañana", marca 'shiftType' como 'Día'.
       - Si es Fin de Semana, asume 'Día' a menos que se especifique lo contrario.
    
    Retorna JSON Array:
    [
      { "date": "2024-12-17", "name": "Julio Pérez", "role": "Técnico", "shiftType": "Noche" },
      { "date": "2024-12-18", "name": "Eduardo Leal", "role": "Supervisor", "shiftType": "Día" }
    ]
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as Shift[];

    } catch (error) {
        console.error("Error analyzing shift schedule:", error);
        return [];
    }
};

// --- Voice Assistant Logic (Record & Consult) ---

export interface VoiceCommandResult {
    intent: 'CREATE' | 'DELETE';
    data: Partial<MaintenanceRecord>;
}

export const processVoiceCommand = async (audioBase64: string): Promise<VoiceCommandResult | null> => {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key no encontrada");

    // Clean base64 header if present
    const cleanBase64 = audioBase64.split(',')[1] || audioBase64;

    const prompt = `
    Escucha este audio de un técnico de mantenimiento.
    
    Fecha actual: ${new Date().toISOString().split('T')[0]}
    
    Tu tarea es determinar la INTENCIÓN del usuario:
    1. **CREATE**: Si está dictando una nueva mantención (ej: "José revisó los ascensores 1 y 2 en el sector norte").
    2. **DELETE**: Si quiere borrar o eliminar un registro (ej: "Borra la mantención de la Torre Marina", "Me equivoqué, elimina lo de hoy").

    Extrae los datos en JSON.

    Reglas para DELETE:
    - Necesitamos saber QUÉ borrar. Extrae 'equipmentOrder', 'date' y 'location' para poder encontrar el registro.
    - Si dice "hoy", usa la fecha actual.

    Reglas para CREATE:
    - Ubicación: 'Marina', 'Boulevard', 'Ama'.
    - Sector: Intenta mapear a estos valores si suena parecido: 
        - Marina: Ripley, París, Panorámico, Cine, Torre Marina, Montacargas, Gimnasio, Patio Comida, Cruz Verde.
        - Boulevard: Torre, Estacionamientos, Pasarela, Montacarga, Pisos (1,2,3).
        - Ama: Torre, H&M, Jumbo, Rampas, Escaleras.
      Si no, usa texto libre.
    - Tipo: 'Ascensor', 'Escalera Mecánica'.
    - Técnico: Mapea a uno de estos nombres oficiales si suena similar:
       - Cristian Guerrero
       - Diego Vargas
       - Francisca Chimuelo
       - Italo Sanhueza
       - Javier Silva
       - Jonathan Labbé (o "Jonathan Lave")
       - Jorge Letelier
       - José Krause
       - Julio Pérez
       - Víctor González
       - Víctor Jaramillo
    - Equipo: Identificador o número. AHORA SOPORTA MÚLTIPLES NÚMEROS (ej: "1, 2, 3").
      Si el usuario dice "Ascensor 1 y 2", equipmentOrder debe ser "1, 2".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/webm', data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        intent: { type: "STRING", enum: ["CREATE", "DELETE"] },
                        data: {
                            type: "OBJECT",
                            properties: {
                                technician: { type: "STRING" },
                                location: { type: "STRING", enum: ["Marina", "Boulevard", "Ama"] },
                                sector: { type: "STRING" },
                                equipmentType: { type: "STRING", enum: ["Ascensor", "Escalera Mecánica"] },
                                date: { type: "STRING" },
                                time: { type: "STRING" },
                                equipmentOrder: { type: "STRING" },
                                notes: { type: "STRING" }
                            }
                        }
                    },
                    required: ["intent", "data"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) return null;
        
        return JSON.parse(jsonText) as VoiceCommandResult;
    } catch (error) {
        console.error("Error processing voice command:", error);
        return null;
    }
};

export const checkVoiceConfirmation = async (audioBase64: string): Promise<boolean> => {
    const ai = getAIClient();
    if (!ai) return false;

    const cleanBase64 = audioBase64.split(',')[1] || audioBase64;
    
    const prompt = `
    Escucha el audio. El usuario debe CONFIRMAR o CANCELAR una acción peligrosa (borrar).
    - Si dice "Sí", "Confirmo", "Bórralo", "Dale", "Correcto": Retorna TRUE.
    - Si dice "No", "Cancela", "Espera", "Me equivoqué", "No lo borres": Retorna FALSE.
    
    Retorna JSON: { "confirmed": boolean }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/webm', data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                         confirmed: { type: "BOOLEAN" }
                    }
                }
            }
        });
        const result = JSON.parse(response.text || '{}');
        return result.confirmed === true;
    } catch (e) {
        console.error("Error checking confirmation", e);
        return false;
    }
}

export const consultPendingStatus = async (
    audioBase64: string, 
    currentRecords: MaintenanceRecord[]
): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "Error de conexión con la IA.";

    const cleanBase64 = audioBase64.split(',')[1] || audioBase64;
    
    // Create a simplified list of what has been done
    const doneList = currentRecords.map(r => ({
        loc: r.location,
        sec: r.sector,
        eq: r.equipmentOrder
    }));

    const prompt = `
    Eres un asistente de voz para una empresa de mantenimiento.
    
    CONTEXTO (Inventario Total de Equipos):
    ${JSON.stringify(MASTER_INVENTORY)}
    
    MANTENCIONES REALIZADAS ESTE MES (Lo que ya se hizo):
    ${JSON.stringify(doneList)}

    INSTRUCCIÓN:
    1. Escucha la pregunta del usuario en el audio.
    2. Si pregunta "¿Qué falta?" o por una ubicación específica (ej: "¿Qué falta en Ama?"), compara el Inventario Total con las Mantenciones Realizadas.
    3. Responde de forma **hablada y natural** (como si fueras una persona).
    4. Sé conciso. No listes todo si falta mucho, resume (ej: "Faltan 3 equipos en Ama: la Torre y dos ascensores"). Si falta poco, nómbralos.
    5. Si todo está listo, felicita al equipo.
    
    Tu respuesta será leída en voz alta, así que no uses Markdown ni símbolos complejos, solo texto plano en español.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/webm', data: cleanBase64 } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No pude analizar los pendientes.";
    } catch (error) {
        console.error("Error consulting status:", error);
        return "Hubo un error al consultar el estado.";
    }
};

// --- Help/Guide Assistant Logic ---

export const askAssistant = async (userQuery: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: No se pudo conectar con el servicio de IA.";

  const systemContext = `
    Eres el asistente experto de la aplicación "Gestor de Mantenciones Verticales".
    
    INFORMACIÓN DE LA APP:
    - **Propósito**: Organizar mantenciones de ascensores y escaleras mecánicas.
    - **Ubicaciones**: Mol Marina, Boulevard, Ama.
    - **Funcionalidades**:
      1. **Agregar Registro**: Botón "Nuevo". Se piden datos como Fecha, Hora, Técnico, Sector (Opcional), Ubicación, Equipo (Selección múltiple 1-22).
      2. **Asistente de Voz**: Botón flotante (micrófono) abajo a la derecha. Permite dictar la mantención (ej: "José revisó los ascensores 1 y 2").
      3. **Vistas**: Calendario (visual) y Lista (tabla detallada).
      4. **Exportar**: Menú "Exportar" para generar PDF (para Drive) o CSV (Excel), compartir por WhatsApp o Correo.
      5. **Análisis IA**: Botón "Analizar" que busca patrones en los datos del mes.
      6. **Notas de Audio**: Se pueden grabar notas de voz dentro de cada registro.
      7. **Escanear Inventario**: Botón de cámara. Permite subir una foto (lista o plano) para comparar qué equipos faltan por mantener.
      8. **Carga de Turnos**: En menú "Nuevo" -> "Cargar Turnos". Sube foto o PDF y la IA detecta supervisores asignados por fecha.
    
    Tu trabajo es responder preguntas del usuario sobre cómo usar la app de forma breve, amigable y en español.
    Si te preguntan algo fuera del contexto de la app, indica cortésmente que solo sabes de mantenciones.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemContext,
      }
    });
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hubo un error al procesar tu pregunta.";
  }
};
