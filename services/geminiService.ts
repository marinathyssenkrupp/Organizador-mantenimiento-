
import { GoogleGenAI, Schema } from "@google/genai";
import { MaintenanceRecord, Location, EquipmentType, Shift } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Master Inventory List for Gap Analysis
const MASTER_INVENTORY = {
  [Location.MOL_MAL_MARINO]: [
    "Ripley", "París", "Torre Marina", "Ascensor Panorámico", "Cine", "Montacargas 14 Norte", "Montacargas 15 Norte",
    "Gimnasio", "Sector Patio Comida", "Sector Cruz Verde"
  ],
  [Location.MARINA_BOULEVARD]: [
    "Torre Boulevard", "Estacionamientos Otis", "Pasarela Boulevard", "Montacarga Boulevard",
    "Primer Piso", "Segundo Piso", "Tercer Piso", "Pasarelas"
  ],
  [Location.AMA]: [
    "Torre AMA", "Ascensores H&M", "Estacionamientos Torre Ama", "Ascensores Jumbo", "Montacargas de AMA",
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

    const maintainedEquipment = currentRecords.map(r => 
        `${r.equipmentOrder} (${r.location} - ${r.sector || 'General'}) - ${r.date}`
    );

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
    Analiza esta imagen/documento de una planilla de turnos.
    
    REGLA DE ORO (FILTRO):
    Solo me interesan los turnos que cumplan estas condiciones:
    1. Sean del sector **"Mall Marina"** (o "Marina"). Si no dice sector, asume que es Marina. Ignora Boulevard o Ama si están explícitos.
    2. Extrae SIEMPRE si es **Supervisor**.
    3. Extrae Técnicos SOLO si es **Fin de Semana** (Sábado/Domingo) o Turno Especial (Noche).
    
    Instrucciones:
    1. Busca fechas (YYYY-MM-DD).
    2. Identifica nombres.
    3. Asigna 'role': "Supervisor" o "Técnico".
    4. Asigna 'shiftType': "Día" o "Noche".
    5. Asigna 'location': "Marina" (Si es Boulevard o Ama y lo detectas, márcalo como tal, para filtrar después).

    Retorna JSON Array:
    [
      { "date": "2024-12-17", "name": "Julio Pérez", "role": "Técnico", "shiftType": "Noche", "location": "Marina" },
      { "date": "2024-12-18", "name": "Eduardo Leal", "role": "Supervisor", "shiftType": "Día", "location": "Marina" }
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

    const cleanBase64 = audioBase64.split(',')[1] || audioBase64;

    const prompt = `
    Escucha este audio de un técnico de mantenimiento.
    
    Fecha actual: ${new Date().toISOString().split('T')[0]}
    
    Tu tarea es determinar la INTENCIÓN del usuario:
    1. **CREATE**: Si está dictando una nueva mantención.
    2. **DELETE**: Si quiere borrar o eliminar un registro.

    Extrae los datos en JSON.
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
    Escucha el audio. El usuario debe CONFIRMAR (Sí/Correcto) o CANCELAR (No).
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
    
    const doneList = currentRecords.map(r => ({
        loc: r.location,
        sec: r.sector,
        eq: r.equipmentOrder
    }));

    const prompt = `
    Eres un asistente de voz. 
    INVENTARIO: ${JSON.stringify(MASTER_INVENTORY)}
    REALIZADO: ${JSON.stringify(doneList)}
    
    Responde qué falta por mantener según el audio del usuario. Sé breve.
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

export const askAssistant = async (userQuery: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: No se pudo conectar con el servicio de IA.";

  const systemContext = `
    Eres el asistente experto de la aplicación "Gestor de Mantenciones Verticales".
    Responde dudas sobre cómo usar la app (botones, funciones, etc).
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
